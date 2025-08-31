import React, { useState } from 'react';
import PlanCard from './PlanCard';
import { CALL_PLANS, CHAT_PLANS, RAZORPAY_KEY_ID } from '../constants';
import type { User } from '../types';
import { auth } from '../utils/firebase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlansViewProps {
  currentUser: User;
}

// --- Icons ---
const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21,18V6A3,3,0,0,0,18,3H5A3,3,0,0,0,2,6V18A3,3,0,0,0,5,21H18A3,3,0,0,0,21,18ZM5,5H18a1,1,0,0,1,1,1V8H4V6A1,1,0,0,1,5,5ZM15,15a1,1,0,1,1,1-1A1,1,0,0,1,15,15Z" />
    </svg>
);

const TokenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" className="fill-indigo-600 dark:fill-indigo-500" />
        <path d="M10.5 8.5 v7 L14 15.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="8" cy="12" r="1.5" className="fill-white" />
    </svg>
);
// --- End Icons ---

const PlansView: React.FC<PlansViewProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState<number | null>(null); // Track loading by token amount

  const tokenOptions = [
    { amount: 10, price: 50 },
    { amount: 20, price: 95 },
    { amount: 50, price: 230 },
    { amount: 100, price: 450 },
    { amount: 250, price: 1125 },
    { amount: 500, price: 2250 },
  ];

  const handleTokenPurchase = (tokenOption: { amount: number; price: number }) => {
    setLoading(tokenOption.amount);
    
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: tokenOption.price * 100,
      currency: "INR",
      name: "SakoonApp",
      description: `टोकन खरीदें - ${tokenOption.amount} टोकन`,
      image: "https://cdn-icons-png.flaticon.com/512/2966/2966472.png",
      handler: async (response: any) => {
        const { razorpay_payment_id } = response;
        try {
          const user = auth.currentUser;
          if (!user) throw new Error("User not authenticated");
          const idToken = await user.getIdToken(true);

          const verifyUrl = 'https://asia-south1-sakoonapp-9574c.cloudfunctions.net/api/verifyPayment';

          const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ razorpay_payment_id }),
          });

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            throw new Error(errorData.error || 'Payment verification failed on server.');
          }

          alert(`आपका भुगतान सफल रहा! ${tokenOption.amount} टोकन जल्द ही आपके खाते में जोड़ दिए जाएंगे।`);
        } catch (error) {
          console.error("Error during payment verification:", error);
          alert("भुगतान सफल रहा, लेकिन आपके खाते को अपडेट करने में कोई त्रुटि हुई। कृपया सहायता से संपर्क करें।");
        } finally {
          setLoading(null);
        }
      },
      prefill: {
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.mobile || ''
      },
      notes: {
        userId: currentUser.uid,
        purchaseType: 'tokens',
        tokensToBuy: tokenOption.amount,
        planPrice: tokenOption.price, // For transaction record
      },
      theme: { color: "#0891B2" },
      modal: {
        ondismiss: function() {
          setLoading(null);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
          alert(`Oops! Payment Failed: ${response.error.description}`);
          setLoading(null);
      });
      rzp.open();
    } catch(error) {
      alert("भुगतान शुरू करने में एक त्रुटि हुई।");
      setLoading(null);
    }
  };

  const planPairs = CALL_PLANS.map((callPlan, index) => ({
    callPlan,
    chatPlan: CHAT_PLANS[index],
    tierName: callPlan.tierName || '',
    isPopular: callPlan.tierName === 'Gold Pack' || callPlan.tierName === 'Platinum Pack'
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Token Purchase Section */}
      <section className="mb-8">
        <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-3">
                <WalletIcon className="w-8 h-8 text-indigo-500"/>
                <span>Token Plans</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">टोकन खरीदें और अपनी सुविधानुसार कॉल या चैट के लिए उपयोग करें।</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {tokenOptions.map(option => (
                <div key={option.amount} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-between transition-all hover:shadow-lg hover:scale-105">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <TokenIcon className="w-6 h-6"/>
                            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{option.amount}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">टोकन</p>
                    </div>
                    <button 
                        onClick={() => handleTokenPurchase(option)}
                        disabled={loading !== null}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {loading === option.amount ? 'प्रोसेसिंग...' : `₹${option.price} Buy`}
                    </button>
                </div>
            ))}
        </div>

        <div className="text-center mt-6 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg max-w-md mx-auto border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-700 dark:text-slate-300">📞 कॉल = 2 टोकन/मिनट</p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">💬 चैट = 1 टोकन/2 मैसेज</p>
        </div>
      </section>

      <div className="text-center my-8">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">DT Plans</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">सभी प्लान 30 दिन के मान्य होंगे</p>
      </div>

      {/* Plan Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {planPairs.map((pair) => (
          <PlanCard 
            key={pair.tierName}
            tierName={pair.tierName}
            callPlan={pair.callPlan}
            chatPlan={pair.chatPlan}
            isPopular={pair.isPopular}
            currentUser={currentUser}
          />
        ))}
      </div>

      {/* Secure Payments Section */}
      <section className="mt-16 text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto">
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">सुरक्षित पेमेंट</h3>
        <div className="flex flex-col items-center gap-y-3 my-4">
          <div className="flex justify-center items-center gap-x-6 sm:gap-x-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_(standalone).svg" alt="Paytm" className="h-6 object-contain" />
          </div>
          <div className="flex justify-center items-center gap-x-6 sm:gap-x-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-6 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-6 object-contain" />
          </div>
        </div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          सभी लेन-देन 100% सुरक्षित और गोपनीय हैं।
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          यदि किसी कारण से आपका भुगतान असफल हो जाता है, तो रिफंड की राशि 24 घंटे के भीतर आपके मूल खाते में वापस जमा कर दी जाएगी।
        </p>
      </section>
    </div>
  );
};

export default PlansView;