import React from 'react';
import type { useWallet } from '../hooks/useWallet';

interface HeaderProps {
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
const MTCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
            <defs><linearGradient id="gold-gradient-header" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="24" cy="24" r="22" fill="url(#gold-gradient-header)" stroke="#DAA520" strokeWidth="2"/><circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);
// --- End Icons ---


const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, wallet, onWalletClick }) => {
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
            {/* Wallet Balance */}
            <button 
                onClick={onWalletClick}
                className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1.5 transition-colors hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
            >
                <MTCoinIcon className="w-6 h-6"/>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">{wallet.tokens || 0}</span>
            </button>
            
            {/* Dark Mode Toggle */}
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