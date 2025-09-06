import React, { useState } from 'react';

// Re-using the types and mock data structure from Wallet.tsx
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
    { id: 1, date: '2024-09-03T16:00:00Z', amount: 99, planType: 'DT Calling', planDetails: '10 min', status: 'Success' },
    { id: 2, date: '2024-09-02T20:30:00Z', amount: 50, planType: 'MT Pack', planDetails: '10 MT', status: 'Failed', refundInfo: '₹50 refunded to UPI – 3 Sep' },
    { id: 3, date: '2024-09-01T16:30:00Z', amount: 20, planType: 'DT Chat', planDetails: '8 messages', status: 'Success' },
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

// Re-using icons from Wallet.tsx
const CallUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>);
const ChatUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v5.5a2 2 0 01-2 2h-5.586l-2.707 2.707A1 1 0 015 13.586V11.5a2 2 0 01-2-2V4z" /></svg>);


const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', ' at');
};

const StatusBadge: React.FC<{ status: RechargeStatus }> = ({ status }) => {
    const styles = {
        Success: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
        Failed: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        Pending: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
};


const HomeHistory: React.FC = () => {
    const [openTab, setOpenTab] = useState<'recharge' | 'usage' | null>(null);

    const handleTabClick = (tab: 'recharge' | 'usage') => {
        setOpenTab(currentOpenTab => (currentOpenTab === tab ? null : tab));
    };
    
    return (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
            {/* Tabs are now the main control */}
            <div className="relative bg-slate-100 dark:bg-slate-800/80 p-1 flex">
                <div 
                    className="absolute top-1 bottom-1 w-1/2 bg-white dark:bg-slate-900 rounded-full shadow-md transition-all duration-300 ease-in-out" 
                    style={{ 
                        transform: openTab === 'recharge' ? 'translateX(0%)' : 'translateX(100%)',
                        opacity: openTab ? 1 : 0
                    }}
                ></div>
                <button 
                    onClick={() => handleTabClick('recharge')} 
                    className={`relative z-10 w-1/2 py-2.5 rounded-full font-bold transition-colors text-sm ${openTab === 'recharge' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}
                    aria-expanded={openTab === 'recharge'}
                >
                    Recharge History
                </button>
                <button 
                    onClick={() => handleTabClick('usage')} 
                    className={`relative z-10 w-1/2 py-2.5 rounded-full font-bold transition-colors text-sm ${openTab === 'usage' ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}
                    aria-expanded={openTab === 'usage'}
                >
                    Usage History
                </button>
            </div>
            
            {/* Accordion Content */}
            <div className={`transition-all duration-500 ease-in-out ${openTab ? 'max-h-[1000px]' : 'max-h-0'} overflow-hidden`}>
                <div className="p-4 pt-3 space-y-3">
                    {openTab === 'recharge' && MOCK_RECHARGE_HISTORY.map(item => (
                        <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-md text-slate-800 dark:text-slate-100">₹{item.amount}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.planType} ({item.planDetails})</p>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                            {item.status === 'Failed' && item.refundInfo && (
                                <div className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 p-1.5 rounded-md">
                                    {item.refundInfo}
                                </div>
                            )}
                        </div>
                    ))}

                    {openTab === 'usage' && MOCK_USAGE_HISTORY.map(item => {
                        const Icon = item.type === 'Call' ? CallUsageIcon : ChatUsageIcon;
                        return (
                            <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
                                <div className={`p-2 rounded-full ${item.type === 'Call' ? 'bg-green-100 dark:bg-green-500/10' : 'bg-blue-100 dark:bg-blue-500/10'}`}>
                                    <Icon className={`w-5 h-5 ${item.type === 'Call' ? 'text-green-600' : 'text-blue-600'}`} />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.type} - {item.duration}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.deduction}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.balance}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
export default HomeHistory;