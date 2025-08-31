

import React, { useState, useEffect, useCallback } from 'react';
import type { User, Listener, PurchasedPlan, CallSession, ChatSession, ActiveView } from './types';
import { auth, db } from './utils/firebase';
import firebase from 'firebase/compat/app';

// Import Components
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import PlansView from './components/Listeners'; // This is the home/plans view
import CallsView from './components/Services';
import ChatsView from './components/LiveFeedback'; // This is the chats view
import ProfileView from './components/About';
import AICompanionButton from './components/AICompanionButton';
import AICompanion from './components/AICompanion';
import PlanSelector from './components/PlanSelector';
import CallUI from './components/CallUI';
import ChatUI from './components/ChatUI';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import CancellationRefundPolicy from './components/CancellationRefundPolicy';

// Main App Component
const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Navigation State
    const [activeView, setActiveView] = useState<ActiveView>('home');
    
    // UI State
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAICompanion, setShowAICompanion] = useState(false);
    const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'cancellation' | null>(null);

    // Data State
    const [balances, setBalances] = useState({ tokenBalance: 0, callMinutes: 0, totalMessages: 0 });
    const [purchasedPlans, setPurchasedPlans] = useState<PurchasedPlan[]>([]);
    
    // Session State
    const [sessionRequest, setSessionRequest] = useState<{ type: 'call' | 'chat', listener: Listener } | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<PurchasedPlan | null>(null);
    const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);

    // PWA Install Prompt
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredInstallPrompt(null);
            });
        }
    };
    
    // Dark Mode Effect
    useEffect(() => {
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newIsDark = !prev;
            if (newIsDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newIsDark;
        });
    };

    // Auth and Data Listener Effect
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
            if (firebaseUser) {
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                
                const unsubscribeUser = userDocRef.onSnapshot(doc => {
                    if (doc.exists) {
                        setUser(doc.data() as User);
                    } else {
                        // Create user doc if it doesn't exist
                        const newUser: User = {
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName || 'New User',
                            email: firebaseUser.email,
                            mobile: firebaseUser.phoneNumber || '',
                            favoriteListeners: [],
                            tokenBalance: 0,
                        };
                        userDocRef.set(newUser, { merge: true });
                        setUser(newUser);
                    }
                    setLoadingAuth(false);
                });

                const unsubscribePlans = userDocRef.collection('purchasedPlans').onSnapshot(snapshot => {
                    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchasedPlan));
                    setPurchasedPlans(plans);
                });

                return () => {
                    unsubscribeUser();
                    unsubscribePlans();
                };
            } else {
                setUser(null);
                setLoadingAuth(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Calculate Balances
    useEffect(() => {
        if (user) {
            const now = Date.now();
            const validPlans = purchasedPlans.filter(p => p.expiryTimestamp > now);

            const totalMinutes = validPlans
                .filter(p => p.type === 'call' && p.remainingSeconds)
                .reduce((sum, p) => sum + (p.remainingSeconds || 0), 0) / 60;

            const totalMessages = validPlans
                .filter(p => p.type === 'chat' && p.remainingMessages)
                .reduce((sum, p) => sum + (p.remainingMessages || 0), 0);
            
            setBalances({
                tokenBalance: user.tokenBalance || 0,
                callMinutes: Math.floor(totalMinutes),
                totalMessages: totalMessages,
            });
        }
    }, [user, purchasedPlans]);

    // Handlers
    const handleLogout = useCallback(() => {
        auth.signOut();
    }, []);

    const handleStartSession = useCallback((type: 'call' | 'chat', listener: Listener) => {
        setSessionRequest({ type, listener });
    }, []);
    
    const handlePlanSelectedForSession = useCallback((plan: PurchasedPlan) => {
        if (!sessionRequest) return;
        
        const sessionDurationSeconds = (type: 'call' | 'chat') => {
            if (plan.isTokenSession) return 3600; // 1 hour max for token sessions
            if (type === 'call') return plan.remainingSeconds || 0;
            return plan.remainingMessages ? plan.remainingMessages * 60 : 0; // Estimate for chat
        };
// FIX: Correctly construct the session object with a narrowed 'type' property to satisfy the CallSession type.
        if (sessionRequest.type === 'call') {
            setActiveCallSession({
                type: 'call',
                listener: sessionRequest.listener,
                plan: plan.plan,
                sessionDurationSeconds: sessionDurationSeconds('call'),
                associatedPlanId: plan.id,
                isTokenSession: !!plan.isTokenSession,
            });
        } else {
// FIX: Correctly construct the session object with a narrowed 'type' property to satisfy the ChatSession type.
            setActiveChatSession({
                type: 'chat',
                listener: sessionRequest.listener,
                plan: plan.plan,
                sessionDurationSeconds: sessionDurationSeconds('chat'),
                associatedPlanId: plan.id,
                isTokenSession: !!plan.isTokenSession,
            });
        }
        setSessionRequest(null);
        setSelectedPlan(plan);
    }, [sessionRequest]);
    
    const handleSessionEnd = useCallback(async (success: boolean, consumedSeconds: number) => {
        if (selectedPlan && user && !selectedPlan.isTokenSession) {
            const planRef = db.collection('users').doc(user.uid).collection('purchasedPlans').doc(selectedPlan.id);
            if (selectedPlan.type === 'call') {
                await planRef.update({
                    remainingSeconds: firebase.firestore.FieldValue.increment(-consumedSeconds)
                });
            }
        }
        // Token consumption is handled inside Call/Chat UI via functions.
        setActiveCallSession(null);
        setActiveChatSession(null);
        setSelectedPlan(null);
    }, [selectedPlan, user]);
    
    const renderActiveView = () => {
        if (!user) return null;
        switch (activeView) {
            case 'home': return <PlansView currentUser={user} />;
            case 'calls': return <CallsView onStartSession={handleStartSession} currentUser={user} />;
            case 'chats': return <ChatsView onStartSession={handleStartSession} currentUser={user} />;
            case 'profile': return (
                <ProfileView 
                    currentUser={user}
                    onShowTerms={() => setShowPolicy('terms')}
                    onShowPrivacyPolicy={() => setShowPolicy('privacy')}
                    onShowCancellationPolicy={() => setShowPolicy('cancellation')}
                    deferredPrompt={deferredInstallPrompt}
                    onInstallClick={handleInstallClick}
                    onLogout={handleLogout}
                />
            );
            default: return <PlansView currentUser={user} />;
        }
    };
    
    if (loadingAuth) {
        return <SplashScreen />;
    }

    if (!user) {
        return <LoginScreen />;
    }
    
    if (activeCallSession) {
        return <CallUI session={activeCallSession} user={user} onLeave={handleSessionEnd} />;
    }

    if (activeChatSession) {
        return <ChatUI session={activeChatSession} user={user} onLeave={handleSessionEnd} />;
    }
    
    return (
        <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-900 flex flex-col min-h-screen shadow-2xl transition-colors duration-300">
            <Header currentUser={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} balances={balances} />
            <main className="flex-grow pb-20">
                {renderActiveView()}
            </main>
            <Footer activeView={activeView} setActiveView={setActiveView} />
            
            {/* Modals and Overlays */}
            <AICompanionButton onClick={() => setShowAICompanion(true)} />
            {showAICompanion && <AICompanion user={user} onClose={() => setShowAICompanion(false)} onNavigateToServices={() => { setActiveView('home'); setShowAICompanion(false); }} />}
            
            {sessionRequest && sessionRequest.type === 'call' &&
                <PlanSelector 
                    type="call" 
                    plans={purchasedPlans}
                    tokenBalance={balances.tokenBalance}
                    onSelect={handlePlanSelectedForSession} 
                    onClose={() => setSessionRequest(null)}
                    onNavigateHome={() => { setActiveView('home'); setSessionRequest(null); }}
                />
            }
            
            {sessionRequest && sessionRequest.type === 'chat' &&
                 <PlanSelector 
                    type="chat" 
                    plans={purchasedPlans}
                    tokenBalance={balances.tokenBalance}
                    onSelect={handlePlanSelectedForSession} 
                    onClose={() => setSessionRequest(null)}
                    onNavigateHome={() => { setActiveView('home'); setSessionRequest(null); }}
                />
            }

            {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
            {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
            {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
        </div>
    );
};

export default App;