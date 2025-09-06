import React from 'react';

// This component now acts as a trigger for the full-screen wallet modal.
// It doesn't show any history itself, just the tab-like buttons.

type HomeHistoryProps = {
    onWalletClick: (tab: 'recharge' | 'usage') => void;
};

const HomeHistory: React.FC<HomeHistoryProps> = ({ onWalletClick }) => {
    return (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 grid grid-cols-2 gap-1">
                <button 
                    onClick={() => onWalletClick('recharge')} 
                    className="w-full py-3 rounded-full font-bold transition-colors text-sm bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-slate-800"
                    aria-label="Open recharge history"
                >
                    Recharge History
                </button>
                <button 
                    onClick={() => onWalletClick('usage')} 
                    className="w-full py-3 rounded-full font-bold transition-colors text-sm bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-slate-800"
                    aria-label="Open usage history"
                >
                    Usage History
                </button>
            </div>
        </section>
    );
};

export default HomeHistory;