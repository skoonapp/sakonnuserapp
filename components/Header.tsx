import React from 'react';
import type { User } from '../types';
import { useWallet } from '../hooks/useWallet'; // To get the type

interface HeaderProps {
  currentUser: User | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  wallet: ReturnType<typeof useWallet>;
  onWalletClick: () => void;
}

// --- Icons ---
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);
const CustomMTIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" className="fill-indigo-600 dark:fill-indigo-500" />
        <path d="M10.5 8.5 v7 L14 15.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="8" cy="12" r="1.5" className="fill-white" />
    </svg>
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


const Header: React.FC<HeaderProps> = ({ currentUser, isDarkMode, toggleDarkMode, wallet, onWalletClick }) => {
  const tokenBalance = wallet.tokens || 0;
  const now = Date.now();
  const validPlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > now);

  const callMinutes = validPlans
      .filter(p => p.type === 'call')
      .reduce((sum, p) => sum + (p.minutes || 0), 0);

  const totalMessages = validPlans
      .filter(p => p.type === 'chat')
      .reduce((sum, p) => sum + (p.messages || 0), 0);

  return (
    <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-cyan-50 dark:from-slate-950 dark:to-cyan-950/40 backdrop-blur-sm border-b border-cyan-100 dark:border-cyan-900/50 z-20">
      <div className="px-4 h-full flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
              SakoonApp
            </h1>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2">
            {currentUser && (
              <button 
                onClick={onWalletClick}
                className="flex items-center space-x-2 md:space-x-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 px-2 py-1.5 rounded-full transition-colors"
                aria-label="Open wallet and transaction history"
              >
                  <div className="flex items-center space-x-1" title={`${tokenBalance} MT`}>
                      <CustomMTIcon className="w-5 h-5"/>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-100">{tokenBalance}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex items-center space-x-1" title={`${callMinutes} मिनट कॉल`}>
                      <CallIcon className="w-5 h-5 text-green-500"/>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-100">{callMinutes}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:border-slate-700"></div>
                  <div className="flex items-center space-x-1" title={`${totalMessages} मैसेज`}>
                      <ChatIcon className="w-5 h-5 text-cyan-500"/>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-100">{totalMessages}</span>
                  </div>
              </button>
            )}
             <button
                onClick={toggleDarkMode}
                className="text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full p-2 transition-colors shrink-0"
                aria-label={isDarkMode ? "लाइट मोड" : "डार्क मोड"}
            >
                {isDarkMode ? <SunIcon className="w-6 h-6"/> : <MoonIcon className="w-6 h-6"/>}
            </button>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);