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
      
      if (result.data.success) {
        return result.data.orderToken; // Return token for the modal
      } else {
        throw new Error(result.data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Re-throw the error to be handled by the UI component
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
      
      if (result.data.success) {
        return result.data.orderToken; // Return token for the modal
      } else {
         throw new Error(result.data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Re-throw the error to be handled by the UI component
      throw error;
    }
  }
}

export const paymentService = new PaymentService();