
import React, { useState } from 'react';
import PlanCard from './PlanCard';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import type { User, Plan as PlanType } from '../types';
import { paymentService } from '../services/paymentService';
import CashfreeModal from './CashfreeModal';


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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [orderToken, setOrderToken] = useState<string | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');


  const tokenOptions = [
    { tokens: 10, price: 50 },
    { tokens: 20, price: 95 },
    { tokens: 50, price: 230 },
    { tokens: 100, price: 450 },
    { tokens: 250, price: 1125 },
    { tokens: 500, price: 2250 },
  ];

  const handleTokenPurchase = async (tokens: number, price: number) => {
    const planKey = `mt_${tokens}`;
    setLoadingPlan(planKey);
    setFeedback(null);
    try {
      const token = await paymentService.buyTokens(tokens, price);
      setPaymentDescription(`${tokens} MT`);
      setOrderToken(token);
    } catch (error: any) {
       setFeedback({ type: 'error', message: error.message || 'Payment failed to initialize.' });
       setTimeout(() => setFeedback(null), 4000);
    } finally {
        setLoadingPlan(null);
    }
  };
  
  const handleDTPlanPurchase = async (planData: PlanType, type: 'call' | 'chat') => {
      const planKey = `${type}_${planData.name}`;
      setLoadingPlan(planKey);
      setFeedback(null);
      try {
        const token = await paymentService.buyDTPlan(planData);
        setPaymentDescription(planData.name || 'Plan');
        setOrderToken(token);
    } catch (error: any) {
        setFeedback({ type: 'error', message: error.message || 'Payment failed to initialize.' });
        setTimeout(() => setFeedback(null), 4000);
    } finally {
        setLoadingPlan(null);
    }
  };

  const handleModalClose = (status: 'success' | 'failure' | 'closed') => {
    if (status === 'success') {
        setFeedback({ type: 'success', message: `Payment for ${paymentDescription} is processing! Your balance will update shortly.` });
    } else if (status === 'failure') {
        setFeedback({ type: 'error', message: 'Payment failed. Please try again.' });
    }
    // For 'closed', we don't show any message.
    setOrderToken(null);
    setPaymentDescription('');
    setTimeout(() => setFeedback(null), 5000);
  };

  const planPairs = CALL_PLANS.map((callPlan, index) => ({
    callPlan,
    chatPlan: CHAT_PLANS[index],
    tierName: callPlan.tierName || '',
    isPopular: callPlan.tierName === 'Gold Pack' || callPlan.tierName === 'Platinum Pack'
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      
      {orderToken && <CashfreeModal orderToken={orderToken} onClose={handleModalClose} />}

      {feedback && (
        <div className={`p-4 mb-4 rounded-lg text-center font-semibold animate-fade-in-down ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
            {feedback.message}
        </div>
      )}

      {/* Token Purchase Section */}
      <section>
        <div className="text-center mb-6">
            <div className="bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                Note: सभी प्लान 30 दिनों के लिए मान्य होंगे।
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
                <WalletIcon className="w-8 h-8 text-indigo-500"/>
                <span>MT Plans</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Money Token खरीदें और अपनी सुविधानुसार कॉल या चैट के लिए उपयोग करें।</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {tokenOptions.map(option => (
                <div key={option.tokens} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between transition-all hover:shadow-lg hover:scale-105">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <TokenIcon className="w-6 h-6"/>
                            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{option.tokens}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">MT</p>
                    </div>
                    <button 
                        onClick={() => handleTokenPurchase(option.tokens, option.price)}
                        disabled={loadingPlan !== null}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {loadingPlan === `mt_${option.tokens}` ? 'प्रोसेसिंग...' : `₹${option.price} Buy`}
                    </button>
                </div>
            ))}
        </div>

        <div className="text-center mt-6 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg max-w-md mx-auto border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-200">📞 कॉल = 2 MT/मिनट</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">💬 चैट = 1 MT/2 मैसेज</p>
        </div>
      </section>

      <div className="text-center mt-8 mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">DT Plans</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">Direct Plans से फिक्स मिनट और मैसेज के लिए उपयोग करें।</p>
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
            onPurchase={handleDTPlanPurchase}
            loadingPlan={loadingPlan}
          />
        ))}
      </div>

      {/* Secure Payments Section */}
      <section className="mt-16 text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto">
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">सुरक्षित पेमेंट</h3>
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
          यदि किसी कारण से आपका भुगतान असफल हो जाता है, तो रिफंड की राशि 5-7 व्यावसायिक दिनों के भीतर आपके मूल खाते में वापस जमा कर दी जाएगी।
        </p>
      </section>
    </div>
  );
};

export default PlansView;