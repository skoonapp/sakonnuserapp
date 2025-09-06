import React, { useState } from 'react';
import type { useWallet } from '../hooks/useWallet';

type WalletProps = {
    wallet: ReturnType<typeof useWallet>;
    onClose: () => void;
    onNavigateHome: () => void;
};

// --- MOCK DATA (Replace with actual data fetching) ---
type RechargeStatus = 'Success' | 'Failed' | 'Pending';
type RechargeHistoryItem = {
    id: number;
    date: string;
    amount: number;
    planType: string;
    planDetails: string;
    status: RechargeStatus;
    refundInfo?: string;
};

const MOCK_RECHARGE_HISTORY: RechargeHistoryItem[] = [
    { id: 1, date: '2024-09-03T10:30:00Z', amount: 99, planType: 'DT Calling', planDetails: '10 min', status: 'Success' },
    { id: 2, date: '2024-09-02T15:00:00Z', amount: 50, planType: 'MT Pack', planDetails: '10 MT', status: 'Failed', refundInfo: '₹50 refunded to UPI – 3 Sep' },
    { id: 3, date: '2024-09-01T11:00:00Z', amount: 20, planType: 'DT Chat', planDetails: '8 messages', status: 'Success' },
    { id: 4, date: '2024-08-30T09:00:00Z', amount: 230, planType: 'MT Pack', planDetails: '50 MT', status: 'Pending' },
    { id: 5, date: '2024-08-28T18:45:00Z', amount: 145, planType: 'DT Calling', planDetails: '15 min', status: 'Success' },
];

type UsageHistoryItem = {
    id: number;
    date: string;
    type: 'Call' | 'Chat';
    duration: string;
    deduction: string;
    balance: string;
};

const MOCK_USAGE_HISTORY: UsageHistoryItem[] = [
    { id: 1, date: '2024-09-03T11:00:00Z', type: 'Call', duration: '4 Min', deduction: 'DT Plan Used', balance: '6 Min Left in Plan' },
    { id: 2, date: '2024-09-02T18:00:00Z', type: 'Chat', duration: '10 Messages', deduction: '5 MT Deducted', balance: '42 MT' },
    { id: 3, date: '2024-09-01T12:00:00Z', type: 'Call', duration: '5 Min', deduction: '10 MT Deducted', balance: '50 MT' }
];
// --- END MOCK DATA ---


// --- ICONS ---
const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
    </svg>
);

const MTCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
            <defs><linearGradient id="gold-gradient-wallet" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="24" cy="24" r="22" fill="url(#gold-gradient-wallet)" stroke="#DAA520" strokeWidth="2"/><circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);

const CallUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>);
const ChatUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v5.5a2 2 0 01-2 2h-5.586l-2.707 2.707A1 1 0 015 13.586V11.5a2 2 0 01-2-2V4z" /></svg>);
// --- END ICONS ---


const Wallet: React.FC<WalletProps> = ({ wallet, onClose, onNavigateHome }) => {
    const [activeTab, setActiveTab] = useState<'recharge' | 'usage'>('recharge');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return { day, time };
    };

    const StatusBadge: React.FC<{ status: RechargeStatus }> = ({ status }) => {
        const styles = {
            Success: 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-300',
            Failed: 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-300',
            Pending: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-300',
        };
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status}</span>;
    };


    return (
        <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col animate-fade-in-up">
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-slate-900 shadow-sm z-10 flex items-center p-4 gap-4">
                <button onClick={onClose} className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-2" aria-label="Close Wallet">
                    <BackIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Wallet</h1>
            </header>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto pb-32">
                {/* Balance Card */}
                <div className="p-4">
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 flex justify-between items-center overflow-hidden">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Wallet Balance</p>
                            <div className="flex items-center gap-2 mt-1">
                                <MTCoinIcon className="w-10 h-10" />
                                <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{wallet.tokens || 0}</span>
                            </div>
                        </div>
                        <img src="https://i.imgur.com/3w60w5W.png" alt="Wallet illustration" className="w-28 h-28 absolute -right-4 -bottom-4 opacity-80" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 pt-2">
                    <div className="relative bg-slate-200 dark:bg-slate-800/80 p-1 rounded-full flex">
                        <div 
                            className="absolute top-1 bottom-1 w-1/2 bg-white dark:bg-slate-900 rounded-full shadow-md transition-transform duration-300 ease-in-out" 
                            style={{ transform: activeTab === 'recharge' ? 'translateX(0%)' : 'translateX(100%)' }}
                        ></div>
                        <button onClick={() => setActiveTab('recharge')} className={`relative z-10 w-1/2 py-2.5 rounded-full font-bold transition-colors text-sm ${activeTab === 'recharge' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            Recharge History
                        </button>
                        <button onClick={() => setActiveTab('usage')} className={`relative z-10 w-1/2 py-2.5 rounded-full font-bold transition-colors text-sm ${activeTab === 'usage' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            Usage History
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div className="p-4 space-y-3">
                    {activeTab === 'recharge' && MOCK_RECHARGE_HISTORY.map(item => {
                        const { day, time } = formatDate(item.date);
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">₹{item.amount}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.planType} ({item.planDetails})</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{day} at {time}</p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                                {item.status === 'Success' && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
                                        <button onClick={onNavigateHome} className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline">Buy Again</button>
                                    </div>
                                )}
                                {item.status === 'Failed' && item.refundInfo && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2 rounded-md">{item.refundInfo}</p>
                                )}
                            </div>
                        );
                    })}

                    {activeTab === 'usage' && MOCK_USAGE_HISTORY.map(item => {
                        const { day, time } = formatDate(item.date);
                        const Icon = item.type === 'Call' ? CallUsageIcon : ChatUsageIcon;
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className={`p-3 rounded-full ${item.type === 'Call' ? 'bg-green-100 dark:bg-green-500/10' : 'bg-blue-100 dark:bg-blue-500/10'}`}>
                                    <Icon className={`w-6 h-6 ${item.type === 'Call' ? 'text-green-600' : 'text-blue-600'}`} />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.type} - {item.duration}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.deduction}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{day} at {time}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">{item.balance}</p>
                                    <p className="text-xs text-slate-400">Balance</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
            
            {/* Footer Quick Actions */}
            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onNavigateHome} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold py-3.5 px-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        ➕ Add Money
                    </button>
                    <button onClick={onNavigateHome} className="w-full bg-cyan-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-cyan-700 transition-colors">
                        🔁 Buy Again
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Wallet;
