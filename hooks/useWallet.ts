import { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import type { ActivePlan, User } from "../types";

interface WalletState {
    tokens: number;
    activePlans: ActivePlan[];
    loading: boolean;
}

export const useWallet = (user: User | null) => {
  const [wallet, setWallet] = useState<WalletState>({
    tokens: 0,
    activePlans: [],
    loading: true, // Start in loading state until we know if there is a user
  });
  
  useEffect(() => {
    // If there's no user, the wallet is empty and we're not loading.
    if (!user) {
      setWallet({ tokens: 0, activePlans: [], loading: false });
      return;
    }
    
    // Set loading to true when we start fetching for a new user, but keep old data
    setWallet(prev => ({ ...prev, loading: true }));

    const userDocRef = db.collection("users").doc(user.uid);
    const unsubscribeDoc = userDocRef.onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        setWallet({
          tokens: data?.tokens || 0,
          activePlans: data?.activePlans || [],
          loading: false
        });
      } else {
         // This case should be handled by user creation logic in App.tsx, but as a fallback:
         setWallet({ tokens: 0, activePlans: [], loading: false });
      }
    }, (error) => {
        console.error("Error listening to wallet:", error);
        setWallet({ tokens: 0, activePlans: [], loading: false });
    });
    
    // Cleanup function for the effect
    return () => unsubscribeDoc();

  }, [user]); // Dependency array ensures this runs when the user state changes.
  
  return wallet;
};