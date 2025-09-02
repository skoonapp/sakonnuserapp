import { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase";
import type { ActivePlan } from "../types";

interface WalletState {
    tokens: number;
    activePlans: ActivePlan[];
    loading: boolean;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    tokens: 0,
    activePlans: [],
    loading: true
  });
  
  useEffect(() => {
    // FIX: Switched from modular `onAuthStateChanged(auth, ...)` to compat `auth.onAuthStateChanged(...)` to match the `auth` instance type from `utils/firebase`.
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // FIX: Switched from modular `doc(db, ...)` and `onSnapshot(ref, ...)` to the compat SDK's chained method syntax.
        const userDocRef = db.collection("users").doc(user.uid);
        const unsubscribeDoc = userDocRef.onSnapshot((doc) => {
          // FIX: In the compat SDK, `exists` is a boolean property, not a method like `exists()`.
          if (doc.exists) {
            const data = doc.data();
            setWallet({
              tokens: data?.tokens || 0,
              activePlans: data?.activePlans || [],
              loading: false
            });
          } else {
             setWallet({ tokens: 0, activePlans: [], loading: false });
          }
        }, (error) => {
            console.error("Error listening to wallet:", error);
            setWallet({ tokens: 0, activePlans: [], loading: false });
        });
        
        return () => unsubscribeDoc();
      } else {
        setWallet({ tokens: 0, activePlans: [], loading: false });
      }
    });
    
    return () => unsubscribeAuth();
  }, []);
  
  return wallet;
};
