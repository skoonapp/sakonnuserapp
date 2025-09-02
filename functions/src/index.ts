import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Switched to standard ES6 module imports and imported specific types to resolve module format errors.
import express, {Request, Response, NextFunction} from "express";
import cors from "cors";
import {RtcTokenBuilder, RtcRole} from "zego-express-engine";
import Razorpay from "razorpay";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// FIX: Initialized the missing razorpayInstance with credentials from function config.
const razorpayInstance = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

// Declaration merging to add 'user' to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

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
app.use(express.json());

// Middleware to check Firebase Auth token
// FIX: Explicitly typed req, res, and next with imported express types for correct type inference.
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    res.status(403).send("Unauthorized");
    return;
  }
  const idToken = req.headers.authorization.split("Bearer ")[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (e) {
    res.status(403).send("Unauthorized");
    return;
  }
};

/**
 * Processes a purchase by updating the user's balance in Firestore.
 * This now updates the new schema with 'tokens' and 'activePlans' array.
 * @param {any} paymentNotes - The notes object from the Razorpay payment.
 * @param {string} paymentId - The unique Razorpay payment ID.
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
    const tokens = parseInt(planDetails.tokens, 10);
    if (isNaN(tokens) || tokens <= 0) {
      throw new Error(`Invalid tokens value: ${planDetails.tokens}`);
    }
    await userRef.update({
      tokens: admin.firestore.FieldValue.increment(tokens),
    });
    console.log(`Successfully added ${tokens} MT to user ${userId}`);
  } else { // Handle DT plan purchase
    const newPlan = {
      ...planDetails,
      id: `plan_${Date.now()}`,
      purchaseTimestamp: admin.firestore.Timestamp.now().toMillis(),
      expiryTimestamp: admin.firestore.Timestamp.now().toMillis() +
          (30 * 24 * 60 * 60 * 1000), // 30-day expiry
    };
    await userRef.update({
      activePlans: admin.firestore.FieldValue.arrayUnion(newPlan),
    });
    console.log(`Successfully added ${planDetails.name} plan for ${userId}`);
  }

  // Mark payment as processed
  await paymentRef.set({
    userId: userId,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: paymentNotes,
  });
};


// Zego Token Generation Endpoint
// FIX: Explicitly typed req and res with imported express types for correct type inference.
app.post("/generateZegoToken", authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.uid;
  const {planId} = req.body;

  if (!planId) {
    res.status(400).send({error: "Plan ID is required."});
    return;
  }

  // NOTE: Balance check is now done pre-session via deductUsage.
  // This token generation assumes a balance check has already passed.

  try {
    const appID = parseInt(functions.config().zego.app_id, 10);
    const serverSecret = functions.config().zego.server_secret;
    const effectiveTimeInSeconds = 3600; // 1 hour validity for the token
    const payload = "";
    const zegoUserId = firebaseUIDtoZegoUID(userId);
    const channelId = planId; // Use planId as the unique channel/room ID

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID, serverSecret, channelId,
      zegoUserId,
      RtcRole.PUBLISHER, effectiveTimeInSeconds, payload,
    );
    res.status(200).send({token});
  } catch (error) {
    console.error("Error generating Zego token:", error);
    res.status(500).send({error: "Could not generate session token."});
  }
});


// Razorpay Webhook Endpoint
// FIX: Explicitly typed req and res with imported express types for correct type inference.
app.post("/razorpayWebhook", async (req: Request, res: Response) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers["x-razorpay-signature"] as string;

  try {
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      res.status(400).send("Invalid signature");
      return;
    }

    const event = req.body.event;
    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      await processPurchase(payment.notes, payment.id);
    }
    res.status(200).send({status: "success"});
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
});


export const api = functions.region("us-central1").https.onRequest(app);

// --- FIX: Added the missing addEarning callable function ---
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

// NEW: Renamed from createRazorpayOrder to align with new service
export const createPaymentOrder = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const {amount, planType, planDetails} = data;

    const notes = {
      userId: context.auth.uid,
      planType: planType,
      planDetails: planDetails, // e.g., { tokens: 50, price: 230 }
    };

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_user_${context.auth.uid}_${Date.now()}`,
      notes: notes,
    };

    try {
      const order = await razorpayInstance.orders.create(options);
      return {success: true, order};
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create payment order."
      );
    }
  });


// Callable function to verify payment signature
export const verifyPayment = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = data;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Payment verification data is required."
      );
    }

    try {
      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", functions.config().razorpay.key_secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Payment verification failed: Invalid signature."
        );
      }

      // Fetch payment from Razorpay to get notes and verify status
      const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
      if (payment.status !== "captured") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Payment not successful."
        );
      }

      // Process the purchase (credits user account, idempotency check inside)
      await processPurchase(payment.notes, razorpay_payment_id);

      return {status: "success", message: "Payment verified and processed."};
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to verify payment."
      );
    }
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
