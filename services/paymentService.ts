import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../utils/firebase";
import { RAZORPAY_KEY_ID } from "../constants";
import type { Plan } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

class PaymentService {
  private functions = getFunctions();
  
  // 🟢 Buy Token Plan
  async buyTokens(tokens: number, price: number) {
    if (!auth.currentUser) {
      alert("Please login first!");
      return;
    }
    
    try {
      const createOrder = httpsCallable(this.functions, "createPaymentOrder");
      
      const result: any = await createOrder({
        amount: price,
        planType: "token",
        planDetails: { tokens, price }
      });
      
      if (result.data.success) {
        return this.openRazorpay(result.data.order, price, `${tokens} Tokens`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed! Try again.");
    }
  }
  
  // 🟢 Buy DT Plan
  async buyDTPlan(planData: Plan) {
    if (!auth.currentUser) {
      alert("Please login first!");
      return;
    }
    
    try {
      const createOrder = httpsCallable(this.functions, "createPaymentOrder");
      
      const result: any = await createOrder({
        amount: planData.price,
        planType: "dt",
        planDetails: planData
      });
      
      if (result.data.success) {
        return this.openRazorpay(
          result.data.order, 
          planData.price, 
          planData.name || "DT Plan"
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed! Try again.");
    }
  }
  
  // 🟢 Open Razorpay
  private openRazorpay(order: any, amount: number, description: string) {
    return new Promise((resolve, reject) => {
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "SakoonApp",
            description: description,
            order_id: order.id,
            handler: async (response: any) => {
                try {
                    const verifyPayment = httpsCallable(this.functions, "verifyPayment");
                    await verifyPayment({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                    alert(`✅ Payment Success! ${description} added to your wallet.`);
                    resolve({success: true});
                } catch (verifyError) {
                    console.error("Payment verification failed:", verifyError);
                    alert("Payment verification failed. If money was deducted, it will be refunded in 5-7 business days.");
                    reject(verifyError);
                }
            },
            prefill: {
                name: auth.currentUser?.displayName || "User",
                email: auth.currentUser?.email || "user@example.com",
            },
            theme: { color: "#0891B2" },
            modal: {
                ondismiss: () => {
                    // This can be considered a failed payment by the user
                    reject({ code: 'user-closed-modal', message: 'Payment modal was closed.' });
                }
            }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    });
  }
}

export const paymentService = new PaymentService();
