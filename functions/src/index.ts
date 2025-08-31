



import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Separated express runtime and type imports to resolve type errors on Request and Response objects.
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import {RtcTokenBuilder, RtcRole} from "zego-express-engine";
import Razorpay from "razorpay";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

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

const razorpayInstance = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

// Middleware to check Firebase Auth token
// FIX: Use imported express types for correct typing.
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
 * Includes an idempotency check to prevent processing the same payment twice.
 * @param {any} paymentNotes - The notes object from the Razorpay payment.
 * @param {string} paymentId - The unique Razorpay payment ID.
 */
const processPurchase = async (paymentNotes: any, paymentId: string) => {
  const {
    userId,
    purchaseType,
    tokensToBuy,
    planType,
    planDuration,
    planPrice,
    messages,
    planId,
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

  if (purchaseType === "tokens") {
    const tokens = parseInt(tokensToBuy, 10);
    if (isNaN(tokens) || tokens <= 0) {
      throw new Error(`Invalid tokensToBuy value: ${tokensToBuy}`);
    }
    const userRef = db.collection("users").doc(userId);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        transaction.set(userRef, {tokenBalance: tokens});
      } else {
        transaction.update(userRef, {
          tokenBalance: admin.firestore.FieldValue.increment(tokens),
        });
      }
    });
    await userRef.collection("tokenTransactions").add({
      tokensAdded: tokens,
      pricePaid: parseInt(planPrice, 10) || 0,
      razorpayPaymentId: paymentId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Successfully added ${tokens} tokens to user ${userId}`);
  } else { // Handle plan purchase
    // ... (rest of plan purchase logic remains the same)
    let newPlan: any = {
      type: planType,
      plan: {
        duration: planDuration,
        price: parseInt(planPrice, 10),
      },
      purchaseTimestamp: admin.firestore.Timestamp.now().toMillis(),
      expiryTimestamp: admin.firestore.Timestamp.now().toMillis() +
          (30 * 24 * 60 * 60 * 1000),
      planId: planId || null,
    };

    if (planType === "call") {
      const durationStr = planDuration as string;
      const totalSeconds = durationStr.includes("घंटा") ?
          parseInt(durationStr) * 3600 : parseInt(durationStr) * 60;
      newPlan = {...newPlan, remainingSeconds: totalSeconds, totalSeconds};
    } else if (planType === "chat") {
      const totalMessages = parseInt(messages, 10);
      newPlan = {
        ...newPlan,
        remainingMessages: totalMessages,
        totalMessages,
      };
    }
    await db.collection("users").doc(userId)
      .collection("purchasedPlans").add(newPlan);
    console.log(`Successfully created ${planType} plan for user ${userId}`);
  }

  // Mark payment as processed
  await paymentRef.set({
    userId: userId,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: paymentNotes,
  });
};

// Zego Token Generation Endpoint
// FIX: Use imported express types for correct typing.
app.post("/generateZegoToken", authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.uid;
  const {planId} = req.body;

  if (!planId) {
    res.status(400).send({error: "Plan ID is required."});
    return;
  }

  try {
    if (planId.startsWith("token_session_")) {
       // Proceed for token sessions
    } else {
        const planRef = db
          .collection("users")
          .doc(userId)
          .collection("purchasedPlans")
          .doc(planId);
        const planDoc = await planRef.get();
        if (!planDoc.exists) {
          res.status(404).send({error: "Plan not found."});
          return;
        }
        const planData = planDoc.data();
        const hasBalance = (planData?.remainingSeconds ?? 0) > 0 || (planData?.remainingMessages ?? 0) > 0;
        if (!planData || !hasBalance) {
          res.status(403).send({error: "No balance remaining."});
          return;
        }
    }

    const appID = parseInt(functions.config().zego.app_id, 10);
    const serverSecret = functions.config().zego.server_secret;
    const effectiveTimeInSeconds = 3600;
    const payload = "";

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID, serverSecret, planId,
      firebaseUIDtoZegoUID(userId),
      RtcRole.PUBLISHER, effectiveTimeInSeconds, payload,
    );
    res.status(200).send({token});
  } catch (error) {
    console.error("Error generating Zego token:", error);
    res.status(500).send({error: "Could not generate session token."});
  }
});


// FIX: Use imported express types for correct typing.
app.post("/verifyPayment", authenticate, async (req: Request, res: Response) => {
  const {razorpay_payment_id} = req.body;
  if (!razorpay_payment_id) {
    return res.status(400).send({error: "Payment ID is required."});
  }

  try {
    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      return res.status(400).send({error: "Payment not successful."});
    }

    await processPurchase(payment.notes, razorpay_payment_id);

    return res.status(200).send({status: "success"});
  } catch (error) {
    console.error("Payment verification failed:", error);
    return res.status(500).send({error: "Failed to verify payment."});
  }
});


// Razorpay Webhook Endpoint
// FIX: Use imported express types for correct typing.
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


export const api = functions.region("asia-south1").https.onRequest(app);

export const onListenerStatusChange = functions
  .region("asia-south1")
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