

import React from 'react';
import type { PurchasedPlan } from '../types';

interface PlanSelectorProps {
  type: 'call' | 'chat';
  plans: PurchasedPlan[];
  tokenBalance: number;
  onSelect: (plan: PurchasedPlan) => void;
  onClose: () => void;
  onNavigateHome: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ type, plans, tokenBalance, onSelect, onClose, onNavigateHome }) => {
  const now = Date.now();
  const activePlans = plans.filter(p => 
    !p.isFreeTrial &&
    p.type === type && 
    p.expiryTimestamp > now && 
    ((type === 'call' && (p.remainingSeconds || 0) > 0) || (type === 'chat' && (p.remainingMessages || 0) > 0))
  ).sort((a, b) => a.purchaseTimestamp - b.purchaseTimestamp);

  const canUseTokens = (type === 'call' && tokenBalance >= 2) || (type === 'chat' && tokenBalance >= 1);

  const handleTokenSelect = () => {
    const tokenPlan: PurchasedPlan = {
      id: `token_session_${Date.now()}`,
      type: type,
      plan: { duration: 'टोकन', price: 0 },
      purchaseTimestamp: now,
      expiryTimestamp: now + 3600 * 1000 * 24, // 24h validity
      ...(type === 'call' && { remainingSeconds: 3600, totalSeconds: 3600 }),
      ...(type === 'chat' && { remainingMessages: 999, totalMessages: 999 }),
      // FIX: Removed `listenerId` as it's not a property of PurchasedPlan.
      isTokenSession: true,
    };
    onSelect(tokenPlan);
  };

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) return '0 min';
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-4 text-center">
          {type === 'call' ? 'कॉल के लिए एक प्लान चुनें' : 'चैट के लिए एक प्लान चुनें'}
        </h2>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {activePlans.map(plan => (
            <button key={plan.id} onClick={() => onSelect(plan)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/50 hover:border-cyan-400 transition-all">
              <p className="font-bold text-slate-800 dark:text-slate-200">{plan.plan.duration} {type === 'call' ? 'कॉल' : 'चैट'} प्लान</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {type === 'call' ? `शेष: ${formatTime(plan.remainingSeconds || 0)}` : `शेष: ${plan.remainingMessages} मैसेज`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                समाप्त होगा: {new Date(plan.expiryTimestamp).toLocaleDateString()}
              </p>
            </button>
          ))}

          {canUseTokens && activePlans.length === 0 && (
            <button onClick={handleTokenSelect} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-400 transition-all">
              <p className="font-bold text-slate-800 dark:text-slate-200">टोकन वॉलेट का उपयोग करें</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">बैलेंस: {tokenBalance} टोकन</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                लागत: {type === 'call' ? '2 टोकन/मिनट' : '1 टोकन/2 मैसेज'}
              </p>
            </button>
          )}

          {activePlans.length === 0 && !canUseTokens && (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                    आपके पास कोई सक्रिय प्लान या पर्याप्त टोकन नहीं हैं।
                </p>
                <button onClick={onNavigateHome} className="mt-3 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">
                    होम पर जाएं और खरीदें
                </button>
            </div>
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            रद्द करें
        </button>
      </div>
    </div>
  );
};

export default PlanSelector;