import React, { useState, useEffect, useRef } from 'react';
import type { Plan } from '../types';
import { CALL_PLANS, CHAT_PLANS } from '../constants';


interface HomeHistoryProps {
    onPurchase: (plan: Plan | { tokens: number; price: number }) => void;
}


// --- MOCK DATA (Enriched with plan objects) ---
type RechargeStatus = 'Success' | 'Failed' | 'Pending';
type RechargeHistoryItem = {
    id: number;
    date: string;
    amount: number;
    planType: string;
    planDetails: string;
    status: RechargeStatus;
    refundInfo?: string;
    plan?: Plan | { tokens: number; price: number };
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// FIX: Use 'as const' to prevent TypeScript from widening the 'status' property to a generic string, ensuring it matches the 'RechargeStatus' type.
const MOCK_RECHARGE_HISTORY: RechargeHistoryItem[] = ([
    { id: 1, date: daysAgo(0.5), amount: 99, planType: 'DT Calling', planDetails: '10 min', status: 'Success' },
    { id: 2, date: daysAgo(1.2), amount: 50, planType: 'MT Pack', planDetails: '10 MT', status: 'Failed', refundInfo: '₹50 refunded to UPI' },
    { id: 3, date: daysAgo(2.5), amount: 20, planType: 'DT Chat', planDetails: '8 messages', status: 'Success' },
    { id: 4, date: daysAgo(4), amount: 230, planType: 'MT Pack', planDetails: '50 MT', status: 'Pending' },
    { id: 5, date: daysAgo(6), amount: 145, planType: 'DT Calling', planDetails: '15 min', status: 'Success' },
] as const).map(item => { // Add plan objects for "Buy Again" functionality
    if (item.planType === 'MT Pack') {
        return { ...item, plan: { tokens: parseInt(item.planDetails.split(' ')[0]), price: item.amount } };
    }
    const planList = item.planType === 'DT Calling' ? CALL_PLANS : CHAT_PLANS;
    const foundPlan = planList.find(p => p.price === item.amount);
    return { ...item, plan: foundPlan };
});


type UsageHistoryItem = {
    id: number;
    date: string;
    type: 'Call' | 'Chat';
    duration: string;
    deduction: string;
    balance: string;
};



const MOCK_USAGE_HISTORY: UsageHistoryItem[] = [
    { id: 1, date: daysAgo(0.2), type: 'Call', duration: '4 Min', deduction: 'DT Plan Used', balance: '6 Min Left' },
    { id: 2, date: daysAgo(1), type: 'Chat', duration: '10 Messages', deduction: '5 MT Deducted', balance: '42 MT' },
    { id: 3, date: daysAgo(1.5), type: 'Call', duration: '5 Min', deduction: '10 MT Deducted', balance: '50 MT' },
    { id: 4, date: daysAgo(2), type: 'Chat', duration: '20 Messages', deduction: 'DT Plan Used', balance: '15 Msg Left' },
    { id: 5, date: daysAgo(3), type: 'Call', duration: '12 Min', deduction: '24 MT Deducted', balance: '60 MT' },
    { id: 6, date: daysAgo(4.1), type: 'Call', duration: '2 Min', deduction: 'DT Plan Used', balance: '28 Min Left' },
    { id: 7, date: daysAgo(5), type: 'Chat', duration: '5 Messages', deduction: '2.5 MT Deducted', balance: '84 MT' },
    { id: 8, date: daysAgo(6), type: 'Call', duration: '15 Min', deduction: 'DT Plan Used', balance: '12 Min Left' },
    { id: 9, date: daysAgo(6.5), type: 'Chat', duration: '12 Messages', deduction: '6 MT Deducted', balance: '86.5 MT' },
];

// --- END MOCK DATA ---

// --- ICONS ---
const CallUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>);
const ChatUsageIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v5.5a2 2 0 01-2 2h-5.586l-2.707 2.707A1 1 0 015 13.586V11.5a2 2 0 01-2-2V4z" /></svg>);
const ReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.5h13v4.5a.75.75 0 001.5 0V2.75a.75.75 0 00-1.5 0v4.5h-13V2.75z" /><path d="M6.25 7.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z" /></svg>);
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M15.5 2.5a3 3 0 00-3-3h-5a3 3 0 00-3 3v15a3 3 0 003 3h5a3 3 0 003-3v-15z" /><path fillRule="evenodd" d="M11 5.5a1 1 0 00-1-1h-1a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1v-2zM9 10.5a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM7 14.5a1 1 0 00-1-1h-1a1 1 0 100 2h1a1 1 0 001-1z" clipRule="evenodd" /></svg>);
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201-4.462.75.75 0 011.06-1.06 4 4 0 006.082 3.252.75.75 0 011.06 1.061zm-10.624-1.848a.75.75 0 01-1.06-1.061 4 4 0 00-3.252 6.082.75.75 0 01-1.06 1.06 5.5 5.5 0 014.462-9.201.75.75 0 011.06 1.06z" clipRule="evenodd" />
    </svg>
);
// --- END ICONS ---

const HomeHistory: React.FC<HomeHistoryProps> = ({ onPurchase }) => {
    const [openTab, setOpenTab] = useState<'recharge' | 'usage' | null>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    const handleTabClick = (tab: 'recharge' | 'usage') => {
        setOpenTab(current => (current === tab ? null : tab));
    };

    // --- RENDER LOGIC (from Wallet.tsx) ---
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ' at');
    };
    const StatusBadge: React.FC<{ status: RechargeStatus }> = ({ status }) => {
        const styles = {
            Success: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
            Failed: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
            Pending: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
        };
        return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    // Close accordion on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
                setOpenTab(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderHistoryContent = () => {
        if (!openTab) return null;
        
        return (
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto bg-slate-50 dark:bg-slate-950">
                {openTab === 'recharge' && MOCK_RECHARGE_HISTORY.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">₹{item.amount}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{item.planType} ({item.planDetails})</p>
                            </div>
                            <StatusBadge status={item.status} />
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <p className="text-sm text-slate-400 dark:text-slate-500">{formatDate(item.date)}</p>
                            {item.status === 'Success' && item.plan && (
                                <button 
                                    onClick={() => onPurchase(item.plan!)}
                                    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold py-1.5 px-4 rounded-full text-xs shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                    <span>Buy Again</span>
                                </button>
                            )}
                        </div>
                        {item.status === 'Failed' && item.refundInfo && (
                            <div className="mt-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 p-2 rounded-lg">
                                {item.refundInfo}
                            </div>
                        )}
                    </div>
                ))}

                {openTab === 'usage' && MOCK_USAGE_HISTORY.map(item => {
                    const Icon = item.type === 'Call' ? CallUsageIcon : ChatUsageIcon;
                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${item.type === 'Call' ? 'bg-green-100 dark:bg-green-500/10' : 'bg-blue-100 dark:bg-blue-500/10'}`}>
                                <Icon className={`w-6 h-6 ${item.type === 'Call' ? 'text-green-600' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{item.type} - {item.duration}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.deduction}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(item.date)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-700 dark:text-slate-200">{item.balance}</p>
                                <p className="text-xs text-slate-400">Balance</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <section ref={historyRef} className="bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-cyan-950/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
            <div className="p-2 grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleTabClick('recharge')} 
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-sm shadow-md flex items-center justify-center gap-2 transform hover:scale-105 ${openTab === 'recharge' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300 scale-105' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'}`}
                    aria-label="Toggle recharge history"
                    aria-expanded={openTab === 'recharge'}
                >
                    <ReceiptIcon className="w-5 h-5"/>
                    <span>Recharge History</span>
                </button>
                <button 
                    onClick={() => handleTabClick('usage')} 
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-sm shadow-md flex items-center justify-center gap-2 transform hover:scale-105 ${openTab === 'usage' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300 scale-105' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'}`}
                    aria-label="Toggle usage history"
                    aria-expanded={openTab === 'usage'}
                >
                    <ChartIcon className="w-5 h-5"/>
                    <span>Usage History</span>
                </button>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${openTab ? 'max-h-[60vh]' : 'max-h-0'} overflow-hidden`}>
                {renderHistoryContent()}
            </div>
        </section>
    );
};

export default HomeHistory;