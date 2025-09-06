import React, { useState } from 'react';
import PlanCard from './PlanCard';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import type { User, Plan as PlanType } from '../types';
import { paymentService } from '../services/paymentService';
import CashfreeModal from './CashfreeModal';
import { useWallet } from '../hooks/useWallet';


interface PlansViewProps {
  currentUser: User;
  wallet: ReturnType<typeof useWallet>;
  onWalletClick: () => void;
}

// --- Icons ---
const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21,18V6A3,3,0,0,0,18,3H5A3,3,0,0,0,2,6V18A3,3,0,0,0,5,21H18A3,3,0,0,0,21,18ZM5,5H18a1,1,0,0,1,1,1V8H4V6A1,1,0,0,1,5,5ZM15,15a1,1,0,1,1,1-1A1,1,0,0,1,15,15Z" />
    </svg>
);

const MTCoinIcon: React.FC<{ className?: string; idSuffix?: string }> = ({ className, idSuffix = '1' }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
            <defs><linearGradient id={`gold-gradient-${idSuffix}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="24" cy="24" r="22" fill={`url(#gold-gradient-${idSuffix})`} stroke="#DAA520" strokeWidth="2"/><circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);

const CallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);
// --- End Icons ---


const PlansView: React.FC<PlansViewProps> = ({ currentUser, wallet, onWalletClick }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentDescription, setPaymentDescription] = useState('');

  const tokenBalance = wallet.tokens || 0;
  const now = Date.now();
  const validPlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > now);

  const callMinutes = validPlans
      .filter(p => p.type === 'call')
      .reduce((sum, p) => sum + (p.minutes || 0), 0);

  const totalMessages = validPlans
      .filter(p => p.type === 'chat')
      .reduce((sum, p) => sum + (p.messages || 0), 0);


  const tokenOptions = [
    { tokens: 10, price: 50 },
    { tokens: 20, price: 99 },
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
      const sessionId = await paymentService.buyTokens(tokens, price);
      setPaymentDescription(`${tokens} MT`);
      setPaymentSessionId(sessionId);
    } catch (error: any) {
       setFeedback({ type: 'error', message: `Payment failed to start: ${error.message || 'Please check your connection and try again.'}` });
       setTimeout(() => setFeedback(null), 5000);
    } finally {
        setLoadingPlan(null);
    }
  };
  
  const handleDTPlanPurchase = async (planData: PlanType, type: 'call' | 'chat') => {
      const planKey = `${type}_${planData.name}`;
      setLoadingPlan(planKey);
      setFeedback(null);
      try {
        const sessionId = await paymentService.buyDTPlan(planData);
        setPaymentDescription(planData.name || 'Plan');
        setPaymentSessionId(sessionId);
    } catch (error: any) {
        setFeedback({ type: 'error', message: `Payment failed to start: ${error.message || 'Please check your connection and try again.'}` });
        setTimeout(() => setFeedback(null), 5000);
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
    setPaymentSessionId(null);
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
    <div className="container mx-auto px-4 pt-2 pb-6">
      
      {paymentSessionId && <CashfreeModal paymentSessionId={paymentSessionId} onClose={handleModalClose} />}

      {feedback && (
        <div className={`p-4 mb-4 rounded-lg text-center font-semibold animate-fade-in-down ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
            {feedback.message}
        </div>
      )}
      
      {/* New Balance Card */}
       <button onClick={onWalletClick} className="w-full text-left bg-gradient-to-r from-cyan-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-4 flex items-center justify-around mb-6 transition-transform hover:scale-[1.02] border border-cyan-200 dark:border-slate-700">
          <div className="flex flex-col items-center" title={`${tokenBalance} MT`}>
              <MTCoinIcon className="w-8 h-8 mb-1" idSuffix="balance-card" />
              <span className="font-bold text-2xl text-slate-700 dark:text-slate-100">{tokenBalance}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">MT</span>
          </div>
          <div className="w-px h-10 bg-cyan-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center" title={`${callMinutes} मिनट कॉल`}>
              <CallIcon className="w-7 h-7 text-green-500 mb-1"/>
              <span className="font-bold text-2xl text-slate-700 dark:text-slate-100">{callMinutes}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Call Mins</span>
          </div>
          <div className="w-px h-10 bg-cyan-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center" title={`${totalMessages} मैसेज`}>
              <ChatIcon className="w-7 h-7 text-blue-500 mb-1"/>
              <span className="font-bold text-2xl text-slate-700 dark:text-slate-100">{totalMessages}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Messages</span>
          </div>
      </button>

      {/* Token Purchase Section */}
      <section>
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
                <WalletIcon className="w-8 h-8 text-indigo-500"/>
                <span>MT Plans</span>
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">Money Token खरीदें और अपनी सुविधानुसार कॉल या चैट के लिए उपयोग करें।</p>
            <div className="bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-sm font-semibold px-4 py-2 rounded-full inline-block mt-4">
                Note: सभी प्लान 30 दिनों के लिए मान्य होंगे।
            </div>
        </div>
        
        <div className="max-w-3xl mx-auto pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-x-2 divide-y-2 divide-slate-200 dark:divide-slate-800">
                {tokenOptions.map((option, index) => (
                    <div key={option.tokens} className="bg-white dark:bg-slate-900 p-4 flex flex-col items-center justify-between transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <MTCoinIcon className="w-7 h-7" idSuffix={String(index)} />
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
        </div>
        
        <div className="text-center mt-6 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg max-w-md mx-auto border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-200">📞 कॉल = 2 MT/मिनट</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">💬 चैट = 1 MT/2 मैसेज</p>
            <hr className="my-4 border-slate-300 dark:border-slate-700" />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">DT Plans</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">Direct Plans से फिक्स मिनट और मैसेज के लिए उपयोग करें।</p>
        </div>
      </section>

      {/* Plan Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-200 dark:divide-slate-800 mt-6">
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
      <section className="mt-6 text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto">
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
