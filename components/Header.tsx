import React from 'react';
import type { useWallet } from '../hooks/useWallet';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  wallet: ReturnType<typeof useWallet>;
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
// Using the new Golden MT coin icon as requested
const MTCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
            <defs><linearGradient id="gold-gradient-header" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="24" cy="24" r="22" fill="url(#gold-gradient-header)" stroke="#DAA520" strokeWidth="2"/><circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);
// Icon for DT Calling
const CallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);
// Icon for DT Messaging
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);
// --- End Icons ---


const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, wallet }) => {
  const now = Date.now();
  const activePlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > now);

  const totalMinutes = activePlans
    .filter(p => p.type === 'call' && p.minutes)
    .reduce((sum, p) => sum + (p.minutes || 0), 0);

  const totalMessages = activePlans
    .filter(p => p.type === 'chat' && p.messages)
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
            {/* Wallet Balance */}
            <div 
                className="flex items-center gap-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1"
                aria-label="Wallet balance"
            >
                {/* MT Balance */}
                <div className="flex items-center gap-1">
                    <MTCoinIcon className="w-6 h-6"/>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-md">{wallet.tokens || 0}</span>
                </div>
                
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div> {/* Divider */}

                {/* DT Call Balance */}
                <div className="flex items-center gap-1">
                    <CallIcon className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-md">{totalMinutes}</span>
                </div>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div> {/* Divider */}
                
                {/* DT Chat Balance */}
                <div className="flex items-center gap-1">
                    <ChatIcon className="w-5 h-5 text-cyan-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-md">{totalMessages}</span>
                </div>
            </div>
            
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