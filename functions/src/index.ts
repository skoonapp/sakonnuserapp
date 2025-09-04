import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Use standard ES module import for Express to resolve type conflicts.
// FIX: Added explicit 'Request' and 'Response' imports to resolve type errors in route handlers.
import express, { Request, Response } from "express";
import cors from "cors";
import {RtcTokenBuilder, RtcRole} from "zego-express-engine";
import {Cashfree} from "cashfree-pg";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// FIX: Updated Cashfree initialization to use the setConfig method from the v4 SDK.
// This resolves errors from using deprecated properties like XClientId.
// @ts-ignore - Correcting Cashfree SDK usage, PG property is deprecated.
Cashfree.setConfig({
    clientId: functions.config().cashfree.client_id,
    clientSecret: functions.config().cashfree.client_secret,
    // FIX: Replaced deprecated 'Cashfree.Environment' enum with string values 'PRODUCTION'/'SANDBOX' for the v4 SDK.
    env: functions.config().cashfree.env === "PROD" ?
        "PRODUCTION" :
        "SANDBOX",
});


/**
 * Creates a stable 32-bit unsigned integer from a string UID.
 * Zego User IDs must be 32-bit unsigned integers and cannot be 0.
 * @param {string} uid The Firebase user UID string.
 * @return {number} A 32-bit unsigned integer for Zego.
 */
const firebaseUIDtoZegoUID = (uid: string): number => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Zego User ID must be a 32-bit unsigned integer and cannot be 0.
  const uHash = hash >>> 0;
  return uHash === 0 ? 1 : uHash;
};


const app = express();
app.use(cors({origin: true}));
// Note: We are not using express.json() globally here because the Cashfree webhook
// needs the raw body for signature verification. We'll use it specifically on other routes if needed.


/**
 * Processes a purchase by updating the user's balance in Firestore.
 * This now updates the new schema with 'tokens' and 'activePlans' array.
 * @param {any} paymentNotes - The notes object from the payment.
 * @param {string} paymentId - The unique payment ID.
 */
const processPurchase = async (paymentNotes: any, paymentId: string) => {
  const {
    userId,
    planType,
    planDetails, // This is an object now
  } = paymentNotes;

  if (!userId) {
    throw new Error("User ID missing in payment notes");
  }

  const paymentRef = db.collection("processedPayments").doc(paymentId);
  const paymentDoc = await paymentRef.get();
  if (paymentDoc.exists) {
    console.log(`Payment ${paymentId} has already been processed.`);
    return;
  }

  const userRef = db.collection("users").doc(userId);

  if (planType === "mt") {
    // planDetails might be a string if it comes from webhook tags
    const details = typeof planDetails === "string" ?
      JSON.parse(planDetails) : planDetails;
    const tokens = parseInt(details.tokens, 10);

    if (isNaN(tokens) || tokens <= 0) {
      throw new Error(`Invalid tokens value: ${details.tokens}`);
    }
    await userRef.update({
      tokens: admin.firestore.FieldValue.increment(tokens),
    });
    console.log(`Successfully added ${tokens} MT to user ${userId}`);
  } else { // Handle DT plan purchase
    const details = typeof planDetails === "string" ?
      JSON.parse(planDetails) : planDetails;
    const newPlan = {
      ...details,
      id: `plan_${Date.now()}`,
      purchaseTimestamp: admin.firestore.Timestamp.now().toMillis(),
      expiryTimestamp: admin.firestore.Timestamp.now().toMillis() +
          (30 * 24 * 60 * 60 * 1000), // 30-day expiry
    };
    await userRef.update({
      activePlans: admin.firestore.FieldValue.arrayUnion(newPlan),
    });
    console.log(`Successfully added ${details.name} plan for ${userId}`);
  }

  // Mark payment as processed
  await paymentRef.set({
    userId: userId,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: paymentNotes,
  });
};


// Cashfree Webhook Endpoint
// FIX: Explicitly typed 'req' and 'res' to match Express types, resolving handler signature conflicts.
app.post("/cashfreeWebhook", express.raw({type: "application/json"}),
// FIX: Using express.Request and express.Response to ensure correct types are resolved.
// FIX: Removed explicit types to allow express to infer them correctly and avoid conflicts.
// FIX: Removed explicit Request and Response types from the handler to resolve type conflicts.
  async (req, res) => {
    try {
      const signature = req.headers["x-webhook-signature"] as string;
      const timestamp = req.headers["x-webhook-timestamp"] as string;
      const payload = req.body;

      if (!signature || !timestamp) {
        return res.status(400).send("Webhook signature/timestamp is missing.");
      }

      const secret = functions.config().cashfree.webhook_secret;
      const dataToVerify = timestamp + payload.toString();
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(dataToVerify)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.warn("Webhook signature mismatch.");
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(payload.toString());
      // Check for successful payment event
      if (event.type === "PAYMENT_SUCCESS_WEBHOOK" &&
        event.data.order.order_status === "PAID") {
        const orderTags = event.data.order.order_tags;
        const paymentId = event.data.payment.cf_payment_id;

        if (orderTags && orderTags.userId && paymentId) {
          // Pass the tags directly as they contain our plan info
          await processPurchase(orderTags, paymentId.toString());
        } else {
          console.error("Missing required data in webhook payload", event.data);
        }
      }
      res.status(200).send({status: "success"});
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Internal Server Error");
    }
  });


export const api = functions.region("us-central1").https.onRequest(app);

// REFACTOR: New callable function for Zego token generation
export const generateZegoToken = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const userId = context.auth.uid;
    const {planId} = data;

    if (!planId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Plan ID is required."
      );
    }

    try {
      const appID = parseInt(functions.config().zego.app_id, 10);
      const serverSecret = functions.config().zego.server_secret;
      const effectiveTimeInSeconds = 3600; // 1 hour validity
      const payload = "";
      const zegoUserId = firebaseUIDtoZegoUID(userId);
      const channelId = planId; // Use planId as the unique channel/room ID

      const token = RtcTokenBuilder.buildTokenWithUid(
        appID, serverSecret, channelId,
        zegoUserId,
        RtcRole.PUBLISHER, effectiveTimeInSeconds, payload
      );
      return {token}; // Return data directly
    } catch (error) {
      console.error("Error generating Zego token:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not generate session token."
      );
    }
  });


export const addEarning = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // Check if the user is authenticated.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const {listener_id, user_id, type, duration_minutes, messages} = data;
    const callingUserId = context.auth.uid;

    // Validate that the user calling the function is the user the earning is for.
    if (callingUserId !== user_id) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only record earnings for your own sessions.",
      );
    }

    // Basic validation of input data
    const isInvalidCall = type === "call" && typeof duration_minutes !== "number";
    const isInvalidChat = type === "chat" && typeof messages !== "number";

    if (!listener_id || !type || isInvalidCall || isInvalidChat) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing or invalid required earning data.",
      );
    }

    try {
      const earningRecord = {
        listenerId: listener_id,
        userId: user_id,
        type: type, // 'call' or 'chat'
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Conditionally add fields based on type
        ...(type === "call" && {durationMinutes: duration_minutes}),
        ...(type === "chat" && {messageCount: messages}),
        processed: false, // Flag for a later payout processing job
      };

      await db.collection("earnings").add(earningRecord);

      return {status: "success", message: "Earning recorded successfully."};
    } catch (error) {
      console.error("Error recording earning:", error);
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while trying to record the earning.",
      );
    }
  });

// NEW: Replaced Razorpay with Cashfree for order creation
export const createCashfreeOrder = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const {amount, planType, planDetails} = data;
    const user = await admin.auth().getUser(context.auth.uid);

    const orderRequest = {
      order_id: `order_${Date.now()}`,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: context.auth.uid,
        customer_email: user.email || "user@example.com",
        customer_phone: user.phoneNumber?.replace("+91", "") || "9999999999",
        customer_name: user.displayName || "Sakoon User",
      },
      order_meta: {
        // notify_url is set globally in cashfree config or can be here
        // return_url: "https://yourapp.com/return?order_id={order_id}"
      },
      order_tags: {
        userId: context.auth.uid,
        planType: planType,
        // Stringify details to store in tags
        planDetails: JSON.stringify(planDetails),
      },
    };

    try {
      // @ts-ignore - Correcting Cashfree SDK usage, PG property is deprecated.
      const response = await Cashfree.Orders.create(orderRequest);
      return {
        success: true,
        orderToken: response.data.payment_session_id,
      };
    } catch (error: any) {
      console.error("Cashfree order creation failed:", error.response.data);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create payment order."
      );
    }
  });
  
// NEW: Securely deducts a free message from the user's account.
export const useFreeMessage = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);

    return db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
      }
      const userData = userDoc.data()!;
      const freeMessages = userData.freeMessagesRemaining || 0;

      if (freeMessages <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "You have no free messages left.");
      }

      transaction.update(userRef, {
        freeMessagesRemaining: admin.firestore.FieldValue.increment(-1),
      });

      return {status: "success", remaining: freeMessages - 1};
    });
  });

// NEW: Securely deducts balance for a call session after it ends.
export const finalizeCallSession = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const {consumedSeconds, associatedPlanId} = data;
    if (typeof consumedSeconds !== "number" || consumedSeconds < 0 || !associatedPlanId) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid session data provided.");
    }

    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const consumedMinutes = Math.ceil(consumedSeconds / 60);

    if (consumedMinutes === 0) {
      return {status: "success", message: "No time consumed."};
    }

    return db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
      }
      const userData = userDoc.data()!;
      const activePlans = (userData.activePlans || []).filter((p: any) => p.expiryTimestamp > Date.now());

      // Priority 1: Use DT Plan if it's the one associated with the session
      const planIndex = activePlans.findIndex((p: any) => p.id === associatedPlanId && p.type === "call");
      if (planIndex > -1) {
        const plan = activePlans[planIndex];
        const remainingMinutes = Math.floor((plan.minutes || 0));
        if (remainingMinutes >= consumedMinutes) {
          plan.minutes -= consumedMinutes;
          transaction.update(userRef, {activePlans});
          return {status: "success", message: `Deducted ${consumedMinutes} minutes from plan.`};
        }
      }

      // Priority 2: Use tokens
      const requiredTokens = consumedMinutes * 2;
      if ((userData.tokens || 0) >= requiredTokens) {
        transaction.update(userRef, {tokens: admin.firestore.FieldValue.increment(-requiredTokens)});
        return {status: "success", message: `Deducted ${requiredTokens} MT.`};
      }

      // If neither works, throw an error (should ideally not happen due to pre-checks)
      throw new functions.https.HttpsError("failed-precondition", "Insufficient balance to finalize session.");
    });
  });

// NEW: Securely deducts balance for chat messages.
export const deductUsage = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const {type, messages, associatedPlanId} = data;
    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);

    return db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User not found.");

      const userData = userDoc.data()!;
      const activePlans = (userData.activePlans || []).filter((p: any) => p.expiryTimestamp > Date.now());

      if (type === "chat") {
        // Priority 1: Use the associated DT chat plan
        const planIndex = activePlans.findIndex((p: any) => p.id === associatedPlanId && p.type === "chat");
        if (planIndex > -1) {
          if ((activePlans[planIndex].messages || 0) >= messages) {
            activePlans[planIndex].messages -= messages;
            transaction.update(userRef, {activePlans});
            return {status: "success", planId: activePlans[planIndex].id};
          }
        }
        // Priority 2: Use tokens
        const requiredTokens = messages * 0.5; // 1 token per 2 messages
        if ((userData.tokens || 0) >= requiredTokens) {
          transaction.update(userRef, {tokens: admin.firestore.FieldValue.increment(-requiredTokens)});
          return {status: "success", planId: `mt_session_${Date.now()}`};
        }
      }
      throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
    });
  });


export const onListenerStatusChange = functions
  .region("us-central1")
  .firestore.document("listeners/{listenerId}")
  .onUpdate(async (change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.online === false && afterData.online === true) {
      const listenerId = afterData.id;
      const listenerName = afterData.name || "A listener";
      const listenerImage = afterData.image || "https://cdn-icons-png.flaticon.com/512/2966/2966472.png";

      if (!listenerId) {
        console.error("Listener doc missing 'id'", {afterData});
        return null;
      }
      const usersSnapshot = await db
        .collection("users")
        .where("favoriteListeners", "array-contains", listenerId)
        .get();

      if (usersSnapshot.empty) {
        return null;
      }
      const tokenUserMap = new Map<string, admin.firestore.DocumentReference>();

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          userData.fcmTokens.forEach((token: string) => {
            tokenUserMap.set(token, doc.ref);
          });
        }
      });
      const uniqueTokens = [...tokenUserMap.keys()].filter(Boolean);
      if (uniqueTokens.length === 0) {
        return null;
      }
      const message = {
        notification: {
          title: "Listener ऑनलाइन हैं!",
          body: `${listenerName} अब कॉल या चैट के लिए उपलब्ध हैं।`,
          image: listenerImage,
        },
        webpush: {
          fcm_options: {link: "/?view=calls"},
          notification: {
            actions: [
              {action: "call", title: "📞 कॉल करें"},
              {action: "chat", title: "💬 चैट करें"},
            ],
            data: {view: "calls", listenerId: listenerId.toString()},
          },
        },
        tokens: uniqueTokens,
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        if (response.failureCount > 0) {
          const removals = new Map<string, string[]>();
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const code = resp.error?.code;
              if (code === "messaging/registration-token-not-registered" ||
                  code === "messaging/invalid-registration-token") {
                const token = uniqueTokens[idx];
                const ref = tokenUserMap.get(token);
                if (ref) {
                  if (!removals.has(ref.path)) removals.set(ref.path, []);
                  removals.get(ref.path)!.push(token);
                }
              }
            }
          });

          if (removals.size > 0) {
            const promises: Promise<admin.firestore.WriteResult>[] = [];
            removals.forEach((tokens, path) => {
              promises.push(db.doc(path).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
              }));
            });
            await Promise.all(promises);
          }
        }
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }
    return null;
  });
