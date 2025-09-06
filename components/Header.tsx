import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
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
// --- End Icons ---


const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
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
