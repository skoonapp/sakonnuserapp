import React from 'react';

interface RechargeModalProps {
  onClose: () => void;
  onNavigateHome: () => void;
}

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21,18V6A3,3,0,0,0,18,3H5A3,3,0,0,0,2,6V18A3,3,0,0,0,5,21H18A3,3,0,0,0,21,18ZM5,5H18a1,1,0,0,1,1,1V8H4V6A1,1,0,0,1,5,5ZM15,15a1,1,0,1,1,1-1A1,1,0,0,1,15,15Z" />
    </svg>
);

const RechargeModal: React.FC<RechargeModalProps> = ({ onClose, onNavigateHome }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center border-4 border-red-200 dark:border-red-500/20">
            <WalletIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">
          अपर्याप्त बैलेंस
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">
          इस सत्र को शुरू करने के लिए आपके पास कोई सक्रिय प्लान या पर्याप्त टोकन नहीं हैं।
        </p>

        <div className="space-y-3">
             <button onClick={onNavigateHome} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-cyan-700 transition-colors shadow-lg transform hover:scale-105">
                रिचार्ज करें
            </button>
             <button onClick={onClose} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                बाद में
            </button>
        </div>
      </div>
    </div>
  );
};

export default RechargeModal;