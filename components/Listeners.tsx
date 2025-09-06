import React from 'react';
import PlanCard from './PlanCard';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import type { User, Plan as PlanType } from '../types';
import { useWallet } from '../hooks/useWallet';
import HomeHistory from './HomeHistory';


interface PlansViewProps {
  currentUser: User;
  wallet: ReturnType<typeof useWallet>;
  onPurchase: (plan: PlanType | { tokens: number; price: number }) => void;
  loadingPlan: string | null;
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
// --- End Icons ---


const PlansView: React.FC<PlansViewProps> = ({ currentUser, wallet, onPurchase, loadingPlan }) => {
  const tokenOptions = [
    { tokens: 10, price: 50 },
    { tokens: 20, price: 99 },
    { tokens: 50, price: 230 },
    { tokens: 100, price: 450 },
    { tokens: 250, price: 1125 },
    { tokens: 500, price: 2250 },
  ];

  const planPairs = CALL_PLANS.map((callPlan, index) => ({
    callPlan,
    chatPlan: CHAT_PLANS[index],
    tierName: callPlan.tierName || '',
    isPopular: callPlan.tierName === 'Gold Pack' || callPlan.tierName === 'Platinum Pack'
  }));

  return (
    <div className="container mx-auto px-4 pt-2 pb-6">
      <HomeHistory onPurchase={onPurchase} />

      {/* Token Purchase Section */}
      <section>
          <div className="text-center mb-2">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
                  <WalletIcon className="w-8 h-8 text-indigo-500"/>
                  <span>MT Plans</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Money Token खरीदकर जरूरत के हिसाब से कॉल या चैट कर सकते हैं।</p>
          </div>
          
          <div className="w-1/3 mx-auto mt-2 border-t border-slate-200 dark:border-slate-700"></div>

          <div className="mt-3">
              <div className="mb-3 flex justify-center items-center flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 py-2 px-4 rounded-full max-w-md mx-auto">
                  <span>📞 कॉल = 2 MT/मिनट</span>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                  <span>💬 चैट = 1 MT/2 मैसेज</span>
              </div>
              
              <div className="max-w-3xl mx-auto">
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
                                  onClick={() => onPurchase({ tokens: option.tokens, price: option.price })}
                                  disabled={loadingPlan !== null}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                              >
                                  {loadingPlan === `mt_${option.tokens}` ? 'प्रोसेसिंग...' : `₹${option.price} Buy`}
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* DT Plans Section Header */}
      <section className="mt-4">
        <div className="text-center py-4 border-y border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">DT Plans</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">Direct Plans में तय मिनट और मैसेज मिलते हैं।</p>
        </div>
      </section>

      {/* Plan Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-200 dark:divide-slate-800">
        {planPairs.map((pair) => (
          <PlanCard 
            key={pair.tierName}
            tierName={pair.tierName}
            callPlan={pair.callPlan}
            chatPlan={pair.chatPlan}
            isPopular={pair.isPopular}
            onPurchase={onPurchase}
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