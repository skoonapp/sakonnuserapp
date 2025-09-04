import React from 'react';

interface BottomNavBarProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

// --- Icon Components ---
const HomeIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1m12-1v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-11V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 8v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
       {active ? <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
    </svg>
);
const CallIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const ChatIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
const ProfileIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
// --- End Icon Components ---

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => {
    const activeClasses = 'text-cyan-600 dark:text-cyan-300';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400';
    return (
        <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 transition-colors ${isActive ? activeClasses : inactiveClasses}`}>
            {icon}
            <span className={`text-xs font-bold ${isActive ? 'opacity-100' : 'opacity-90'}`}>{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeIndex, setActiveIndex }) => {
  const navItems = [
    { index: 0, label: 'Home', icon: HomeIcon },
    { index: 1, label: 'Calls', icon: CallIcon },
    { index: 2, label: 'Chats', icon: ChatIcon },
    { index: 3, label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <footer className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-cyan-50 dark:from-slate-950 dark:to-cyan-950/40 backdrop-blur-sm border-t border-cyan-100 dark:border-cyan-900/50 z-40 flex justify-around">
      {navItems.map(item => (
        <NavItem
          key={item.index}
          label={item.label}
          isActive={activeIndex === item.index}
          onClick={() => setActiveIndex(item.index)}
          icon={<item.icon active={activeIndex === item.index} />}
        />
      ))}
    </footer>
  );
};

export default React.memo(BottomNavBar);