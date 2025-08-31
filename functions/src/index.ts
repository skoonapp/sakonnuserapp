

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Use firebase-functions Request and Response types for express handlers to resolve type conflicts.
import express, { NextFunction } from "express";
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


// Middleware to check Firebase Auth token
const authenticate = async (
  req: functions.https.Request,
  res: functions.Response,
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

// Zego Token Generation Endpoint
app.post("/generateZegoToken", authenticate, async (req: functions.https.Request, res: functions.Response) => {
  const userId = req.user!.uid;
  const {planId} = req.body;

  if (!planId) {
    res.status(400).send({error: "Plan ID is required."});
    return;
  }

  try {
    // For token-based sessions, we don't need to check a plan document.
    if (planId.startsWith("token_session_")) {
       // Proceed to generate token without plan validation for token sessions.
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
          res.status(403).send({error: "No balance remaining on this plan."});
          return;
        }
    }


    const appID = parseInt(functions.config().zego.app_id, 10);
    const serverSecret = functions.config().zego.server_secret;
    const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
    const payload = "";

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      serverSecret,
      planId, // Use a unique channel/room ID
      firebaseUIDtoZegoUID(userId), // Zego User ID must be a number
      RtcRole.PUBLISHER,
      effectiveTimeInSeconds,
      payload,
    );

    res.status(200).send({token});
    return;
  } catch (error) {
    console.error("Error generating Zego token:", error);
    res.status(500).send({error: "Could not generate session token."});
    return;
  }
});


// Razorpay Webhook Endpoint
app.post("/razorpayWebhook", async (req: functions.https.Request, res: functions.Response) => {
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
      const {
        userId,
        planDuration,
        planPrice,
        planType,
        planId,
        purchaseType,
        tokensToBuy,
        messages, // New field for chat plans
      } = payment.notes;

      if (!userId) {
        console.error("User ID missing in payment notes");
        res.status(400).send("User ID is missing.");
        return;
      }
      
      if (purchaseType === "tokens") {
        const tokens = parseInt(tokensToBuy, 10);
        if (isNaN(tokens) || tokens <= 0) {
          console.error("Invalid tokensToBuy value:", tokensToBuy);
          res.status(400).send("Invalid token amount.");
          return;
        }
        const userRef = db.collection("users").doc(userId);
        try {
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
            pricePaid: payment.amount / 100,
            razorpayPaymentId: payment.id,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Successfully added ${tokens} tokens to user ${userId}`);
        } catch (e) {
          console.error("Token purchase transaction failed:", e);
        }
      } else { // Handle plan purchase
        if (planId === "daily_deal") {
          const todayStr = new Date(Date.now() + (5.5 * 60 * 60 * 1000))
            .toISOString().split("T")[0];
          const dealRef = db.collection("dailyDeals").doc(todayStr);
          try {
            await db.runTransaction(async (transaction) => {
              const dealDoc = await transaction.get(dealRef);
              const currentCount = dealDoc.exists ? (dealDoc.data()!.count || 0) : 0;
              transaction.set(dealRef, {count: currentCount + 1}, {merge: true});
            });
          } catch (e) {
            console.error("Daily deal transaction failed: ", e);
          }
        }
        
        let newPlan: any = {
            type: planType,
            plan: {
                duration: planDuration,
                price: parseInt(planPrice, 10),
            },
            purchaseTimestamp: admin.firestore.Timestamp.now().toMillis(),
            // 30 days validity
            expiryTimestamp: admin.firestore.Timestamp.now().toMillis() +
              (30 * 24 * 60 * 60 * 1000),
            planId: planId || null,
        };

        if (planType === "call") {
            const durationStr = planDuration as string;
            const totalSeconds = durationStr.includes("घंटा") ?
                parseInt(durationStr) * 3600 :
                parseInt(durationStr) * 60;
            newPlan = {
                ...newPlan,
                remainingSeconds: totalSeconds,
                totalSeconds: totalSeconds,
            };
        } else if (planType === "chat") {
            const totalMessages = parseInt(messages, 10);
             newPlan = {
                ...newPlan,
                remainingMessages: totalMessages,
                totalMessages: totalMessages,
            };
        }
        
        // Handle daily deal activation time
        if (planId === "daily_deal") {
            newPlan.validFromTimestamp = (() => {
                const activationDate = new Date();
                // Set to today 11 PM IST (17:30 UTC)
                activationDate.setUTCHours(17, 30, 0, 0);
                if (activationDate.getTime() < Date.now()) {
                    activationDate.setDate(activationDate.getDate() + 1);
                }
                return activationDate.getTime();
            })();
        }

        await db.collection("users").doc(userId)
          .collection("purchasedPlans").add(newPlan);
        console.log(`Successfully created ${planType} plan for user ${userId}`);
      }
    }
    res.status(200).send({status: "success"});
    return;
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
    return;
  }
});


// Export the API to Firebase Functions
// FIX: Cast express app to 'any' to satisfy onRequest type signature, which is a known issue with firebase-functions v1 types.
export const api = functions.region("asia-south1").https.onRequest(app as any);

// Function to notify users when a favorite listener comes online
export const onListenerStatusChange = functions
  .region("asia-south1")
  .firestore.document("listeners/{listenerId}")
  .onUpdate(async (change) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if listener just came online
    if (beforeData.online === false && afterData.online === true) {
      const listenerId = afterData.id;
      const listenerName = afterData.name || "A listener";
      const listenerImage = afterData.image || "https://cdn-icons-png.flaticon.com/512/2966/2966472.png";

      if (!listenerId) {
        console.error("Listener document is missing 'id' field.", {afterData});
        return null;
      }

      // Find users who have this listener as a favorite
      const usersSnapshot = await db
        .collection("users")
        .where("favoriteListeners", "array-contains", listenerId)
        .get();

      if (usersSnapshot.empty) {
        console.log(`Listener ${listenerName} (ID: ${listenerId}) came online, but no users have them as a favorite.`);
        return null;
      }

      const allTokens: string[] = [];
      const tokenUserMap = new Map<string, admin.firestore.DocumentReference>();

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();

        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          allTokens.push(...userData.fcmTokens);
          userData.fcmTokens.forEach((token: string) => {
            tokenUserMap.set(token, doc.ref);
          });
        }
      });

      const uniqueTokens = [...new Set(allTokens.filter(Boolean))];

      if (uniqueTokens.length === 0) {
        console.log(`Found users for listener ${listenerName}, but they have no FCM tokens or have disabled notifications.`);
        return null;
      }

      console.log(`Sending notifications to ${uniqueTokens.length} unique tokens for ${listenerName}.`);

      const message = {
        notification: {
          title: "Listener ऑनलाइन हैं!",
          body: `${listenerName} अब कॉल या चैट के लिए उपलब्ध हैं।`,
          icon: listenerImage,
          image: listenerImage, // For richer notifications
        },
        webpush: {
          fcm_options: {
            link: "/?view=calls", // Fallback link
          },
          notification: {
            actions: [
              {action: "call", title: "📞 कॉल करें"},
              {action: "chat", title: "💬 चैट करें"},
            ],
            data: {
              view: "calls",
              listenerId: listenerId.toString(),
            },
          },
        },
        tokens: uniqueTokens,
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log("Successfully sent listener online notifications:", response.successCount);

        // Efficiently clean up invalid or unregistered tokens
        if (response.failureCount > 0) {
          const removalsByUser = new Map<string, string[]>();

          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const error = resp.error;
              if (error.code === "messaging/registration-token-not-registered" ||
                  error.code === "messaging/invalid-registration-token") {
                const badToken = uniqueTokens[idx];
                const userRef = tokenUserMap.get(badToken);
                if (userRef) {
                  if (!removalsByUser.has(userRef.path)) {
                    removalsByUser.set(userRef.path, []);
                  }
                  removalsByUser.get(userRef.path)!.push(badToken);
                }
              }
            }
          });

          if (removalsByUser.size > 0) {
            console.log("Cleaning up invalid tokens for users.");
            const updatePromises: Promise<admin.firestore.WriteResult>[] = [];
            removalsByUser.forEach((tokensToRemove, userPath) => {
              console.log(`Removing ${tokensToRemove.length} token(s) for user ${userPath}`);
              const userRef = db.doc(userPath);
              updatePromises.push(userRef.update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
              }));
            });
            await Promise.all(updatePromises);
            console.log("Finished cleaning invalid FCM tokens.");
          }
        }
      } catch (error) {
        console.error("Error sending listener online notifications:", error);
      }
    }
    return null;
  });