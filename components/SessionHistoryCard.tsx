import React from 'react';
import type { SessionHistoryEntry } from '../types';

// Icons
const CallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);

const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);


const SessionHistoryCard: React.FC<{ session: SessionHistoryEntry }> = ({ session }) => {

    const formatDuration = (totalSeconds = 0) => {
        if (totalSeconds < 60) return `${totalSeconds}s`;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    const sessionDate = new Date(session.timestamp).toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <img src={session.listenerImage} alt={session.listenerName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            <div className="flex-grow">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{session.listenerName}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{sessionDate}</p>
            </div>
            <div className="flex-shrink-0 text-right">
                <div className={`flex items-center justify-end gap-2 font-semibold ${session.type === 'call' ? 'text-green-600 dark:text-green-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                    {session.type === 'call' ? <CallIcon className="w-5 h-5" /> : <ChatIcon className="w-5 h-5" />}
                    <span className="text-md">
                        {session.type === 'call'
                            ? formatDuration(session.durationSeconds)
                            : `${session.messageCount} msg`
                        }
                    </span>
                </div>
                <p className="text-xs text-slate-400 capitalize">{session.type} Session</p>
            </div>
        </div>
    );
};

export default React.memo(SessionHistoryCard);
