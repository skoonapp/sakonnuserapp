import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import type { User, SessionHistoryEntry } from '../types';
import SessionHistoryCard from './SessionHistoryCard';
import ViewLoader from './ViewLoader';

interface SessionHistoryProps {
    currentUser: User;
}

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
);


const SessionHistory: React.FC<SessionHistoryProps> = ({ currentUser }) => {
    const [sessions, setSessions] = useState<SessionHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }

        const unsubscribe = db.collection('users').doc(currentUser.uid)
            .collection('sessionHistory')
            .orderBy('timestamp', 'desc')
            .limit(15) // Limiting to the last 15 sessions for now
            .onSnapshot(snapshot => {
                const historyData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        listenerName: data.listenerName,
                        listenerImage: data.listenerImage,
                        type: data.type,
                        timestamp: data.timestamp,
                        durationSeconds: data.durationSeconds,
                        messageCount: data.messageCount,
                    } as SessionHistoryEntry;
                });
                setSessions(historyData);
                setLoading(false);
            }, err => {
                console.error("Error fetching session history:", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <section id="session-history" className="mt-8 py-6 bg-white dark:bg-slate-900 rounded-xl shadow-md">
            <div className="container mx-auto px-6">
                <div className="flex items-center gap-3 mb-6">
                    <HistoryIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-100">Recent Sessions</h3>
                </div>

                {loading ? (
                    <div className="min-h-[10rem] flex items-center justify-center">
                        <ViewLoader />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        <p>You have no past sessions.</p>
                        <p className="text-sm">Completed calls and chats will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <SessionHistoryCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default React.memo(SessionHistory);
