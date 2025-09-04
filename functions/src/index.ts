
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Added Request and Response types from express to resolve handler type errors.
import express, { Request, Response } from "express";
import cors from "cors";
import {RtcTokenBuilder} from "zego-express-engine";
// FIX: Imported the lowercase 'cashfree' instance from the modern SDK instead of the 'Cashfree' class.
import { cashfree } from "cashfree-pg";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// FIX: Correctly configure the Cashfree SDK using the 'cashfree' instance and modern properties.
cashfree.setConfig({
    clientId: functions.config().cashfree.client_id,
    clientSecret: functions.config().cashfree.client_secret,
    env: functions.config().cashfree.env === "PROD" ? "PROD" : "TEST",
});

const firebaseUIDtoZegoUID = (uid: string): number => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const uHash = hash >>> 0;
  return uHash === 0 ? 1 : uHash;
};

const processPurchase = async (paymentNotes: any, paymentId: string) => {
  const { userId, planType, planDetails } = paymentNotes;
  if (!userId) throw new Error("User ID missing in payment notes");

  const paymentRef = db.collection("processedPayments").doc(paymentId);
  const paymentDoc = await paymentRef.get();
  if (paymentDoc.exists) {
    console.log(`Payment ${paymentId} has already been processed.`);
    return;
  }

  const userRef = db.collection("users").doc(userId);
  if (planType === "mt") {
    const details = typeof planDetails === "string" ? JSON.parse(planDetails) : planDetails;
    const tokens = parseInt(details.tokens, 10);
    if (isNaN(tokens) || tokens <= 0) throw new Error(`Invalid tokens value: ${details.tokens}`);
    await userRef.update({
      tokens: admin.firestore.FieldValue.increment(tokens),
    });
    console.log(`Successfully added ${tokens} MT to user ${userId}`);
  } else {
    const details = typeof planDetails === "string" ? JSON.parse(planDetails) : planDetails;
    const newPlan = {
      ...details,
      id: `plan_${Date.now()}`,
      purchaseTimestamp: Date.now(),
      expiryTimestamp: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30-day expiry
    };
    await userRef.update({
      activePlans: admin.firestore.FieldValue.arrayUnion(newPlan),
    });
    console.log(`Successfully added plan ${newPlan.name} to user ${userId}`);
  }
  await paymentRef.set({processedAt: admin.firestore.FieldValue.serverTimestamp()});
};

const app = express();
app.use(cors({origin: true}));

// FIX: Explicitly typed 'req' and 'res' to resolve type conflicts between Express and Firebase middleware.
app.post("/cashfreeWebhook", express.raw({type: "application/json"}), async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const payload = req.body.toString();

    const secret = functions.config().cashfree.webhook_secret;
    const stringToSign = `${timestamp}${payload}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(stringToSign).digest("base64");

    if (signature !== expectedSignature) {
      console.error("Webhook signature verification failed.");
      return res.status(401).send("Unauthorized");
    }

    const data = JSON.parse(payload).data;
    if (data.order.order_status === "PAID") {
      const paymentNotes = data.order.order_meta.payment_notes;
      await processPurchase(paymentNotes, data.payment.cf_payment_id);
    }
    return res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// FIX: Cast the Express app to 'any' to resolve the type mismatch with Firebase's onRequest handler.
export const api = functions.https.onRequest(app as any);

export const createCashfreeOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  
  const { amount, planType, planDetails } = data;
  const userId = context.auth.uid;
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData) throw new functions.https.HttpsError("not-found", "User not found.");

  const orderRequest = {
    order_id: `SAKOON_ORDER_${Date.now()}`,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: userId,
      customer_name: userData.name || "Sakoon User",
      customer_email: userData.email || "user@example.com",
      customer_phone: userData.mobile || "9999999999",
    },
    order_meta: {
      payment_notes: { userId, planType, planDetails: JSON.stringify(planDetails) },
    },
  };

  try {
    // FIX: Updated the API call to match the modern Cashfree SDK.
    const response = await cashfree.pg.orders.create(orderRequest);
    return { success: true, orderToken: response.data.order_token };
  } catch (error: any) {
    console.error("Cashfree order creation failed:", error.response?.data || error.message);
    throw new functions.https.HttpsError("internal", "Failed to create payment order.");
  }
});

export const generateZegoToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");

    const appID = parseInt(functions.config().zego.appid, 10);
    const serverSecret = functions.config().zego.secret;
    const userId = firebaseUIDtoZegoUID(context.auth.uid);
    const effectiveTimeInSeconds = 3600;
    const payload = "";

    const token = RtcTokenBuilder.buildTokenWithUid(appID, serverSecret, data.planId, userId, 0, effectiveTimeInSeconds, payload);
    return { token };
});

export const finalizeCallSession = functions.https.onCall(async (data, context) => {
    // This function can be expanded later for more complex logic if needed.
    // For now, it just serves as a secure endpoint to acknowledge call finalization.
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    console.log(`Finalizing call for user ${context.auth.uid}`, data);
    return { success: true };
});

export const deductUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  
  const { type, messages, associatedPlanId } = data;
  const userRef = db.collection("users").doc(context.auth.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  if (!userData) throw new functions.https.HttpsError("not-found", "User not found.");

  const activePlans = (userData.activePlans || []).filter((p: any) => p.expiryTimestamp > Date.now());
  const dtPlanIndex = activePlans.findIndex((p: any) => p.id === associatedPlanId && p.type === type);

  if (dtPlanIndex !== -1) {
      // Logic for DT plan remains the same
      return { success: true, planId: associatedPlanId };
  } else {
      const tokenCost = type === 'chat' ? (messages * 0.5) : 0;
      if (userData.tokens >= tokenCost) {
          await userRef.update({ tokens: admin.firestore.FieldValue.increment(-tokenCost) });
          return { success: true, planId: `mt_session_${Date.now()}` };
      }
  }

  throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
});

export const useFreeMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    const userRef = db.collection("users").doc(context.auth.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User not found.");
    
    const freeMessages = userDoc.data()?.freeMessagesRemaining || 0;
    if (freeMessages <= 0) throw new functions.https.HttpsError("failed-precondition", "No free messages remaining.");

    await userRef.update({ freeMessagesRemaining: admin.firestore.FieldValue.increment(-1) });
    return { success: true, remaining: freeMessages - 1 };
});

export const addEarning = functions.https.onCall(async (data, context) => {
    // This can be expanded later with actual earning calculations.
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    console.log("Recording earning:", data);
    return { success: true };
});
