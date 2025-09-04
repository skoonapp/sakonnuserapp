import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../utils/firebase";
import type { Plan } from '../types';

declare global {
  interface Window {
    Cashfree: any;
  }
}

class PaymentService {
  private functions = getFunctions();
  
  // 🟢 Buy Token Plan
  async buyTokens(tokens: number, price: number) {
    if (!auth.currentUser) {
      throw new Error("Please login first!");
    }
    
    try {
      const createOrder = httpsCallable(this.functions, "createCashfreeOrder");
      
      const result: any = await createOrder({
        amount: price,
        planType: "mt",
        planDetails: { tokens, price }
      });
      
      // FIX: Updated to check for paymentSessionId for Cashfree v3.
      if (result.data && result.data.success && result.data.paymentSessionId) {
        return result.data.paymentSessionId;
      } else {
        console.error("Invalid response from createCashfreeOrder for MT plan:", result.data);
        throw new Error(result.data.message || 'Failed to create a valid payment order.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      throw error;
    }
  }
  
  // 🟢 Buy DT Plan
  async buyDTPlan(planData: Plan) {
    if (!auth.currentUser) {
      throw new Error("Please login first!");
    }
    
    try {
      const createOrder = httpsCallable(this.functions, "createCashfreeOrder");
      
      const result: any = await createOrder({
        amount: planData.price,
        planType: "dt",
        planDetails: planData
      });
      
      // FIX: Updated to check for paymentSessionId for Cashfree v3.
      if (result.data && result.data.success && result.data.paymentSessionId) {
        return result.data.paymentSessionId;
      } else {
         console.error("Invalid response from createCashfreeOrder for DT plan:", result.data);
         throw new Error(result.data.message || 'Failed to create a valid payment order.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
