


import React, { useState, useEffect, useCallback } from 'react';
import type { User, Listener, PurchasedPlan, CallSession, ChatSession, ActiveView } from './types';
import { auth, db } from './utils/firebase';
import firebase from 'firebase/compat/app';
import { handleCallEnd, handleChat } from './utils/earnings';

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
import CallUI from './components/CallUI';
import ChatUI from './components/ChatUI';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import CancellationRefundPolicy from './components/CancellationRefundPolicy';
import RechargeModal from './components/RechargeModal';


// --- Icons for Install Banner ---
const InstallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 1.5a.75.75 0 01.75.75V12h-1.5V2.25A.75.75 0 0112 1.5z" />
        <path fillRule="evenodd" d="M3.75 13.5a.75.75 0 00-1.5 0v4.5a3 3 0 003 3h10.5a3 3 0 003-3v-4.5a.75.75 0 00-1.5 0v4.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-4.5zm5.03-3.03a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l2.25-2.25a.75.75 0 10-1.06-1.06L12 12.69 8.78 9.47z" clipRule="evenodd" />
    </svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);


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
    const [showRechargeModal, setShowRechargeModal] = useState(false);

    // Data State
    const [balances, setBalances] = useState({ tokenBalance: 0, callMinutes: 0, totalMessages: 0 });
    const [purchasedPlans, setPurchasedPlans] = useState<PurchasedPlan[]>([]);
    
    // Session State
    const [selectedPlan, setSelectedPlan] = useState<PurchasedPlan | null>(null);
    const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);

    // PWA Install Prompt
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Logic to show/hide the install banner
    useEffect(() => {
        const expiryString = localStorage.getItem('pwaInstallDismissedExpiry');
        if (expiryString && new Date().getTime() > Number(expiryString)) {
            localStorage.removeItem('pwaInstallDismissed');
            localStorage.removeItem('pwaInstallDismissedExpiry');
        }
        const isDismissed = localStorage.getItem('pwaInstallDismissed');
        if (deferredInstallPrompt && !isDismissed) {
            setShowInstallBanner(true);
        } else {
            setShowInstallBanner(false);
        }
    }, [deferredInstallPrompt]);

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
                setShowInstallBanner(false);
            });
        }
    };

    const handleInstallDismiss = () => {
        const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days
        localStorage.setItem('pwaInstallDismissed', 'true');
        localStorage.setItem('pwaInstallDismissedExpiry', String(expiry));
        setShowInstallBanner(false);
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
        const now = Date.now();
        
        // Priority 1: Find an active DT plan
        const activePlans = purchasedPlans
            .filter(p => 
                p.type === type && 
                p.expiryTimestamp > now && 
                ((type === 'call' && (p.remainingSeconds || 0) > 10) || // At least 10s left
                 (type === 'chat' && (p.remainingMessages || 0) > 0))
            )
            .sort((a, b) => a.purchaseTimestamp - b.purchaseTimestamp);

        let planToUse: PurchasedPlan | null = null;

        if (activePlans.length > 0) {
            planToUse = activePlans[0];
        } else {
            // Priority 2: Check for tokens if no DT plan is available
            const canUseTokens = (type === 'call' && balances.tokenBalance >= 2) || (type === 'chat' && balances.tokenBalance >= 1);
            if (canUseTokens) {
                planToUse = {
                    id: `token_session_${now}`,
                    type: type,
                    plan: { duration: 'टोकन', price: 0 },
                    purchaseTimestamp: now,
                    expiryTimestamp: now + 24 * 3600 * 1000, // 24h validity
                    ...(type === 'call' && { remainingSeconds: 3600, totalSeconds: 3600 }), // 1hr max
                    ...(type === 'chat' && { remainingMessages: 9999, totalMessages: 9999 }), // Uncapped, balance checked per msg
                    isTokenSession: true,
                };
            }
        }

        if (planToUse) {
            const sessionDurationSeconds = (p: PurchasedPlan) => {
                if (p.isTokenSession) return 3600; // 1 hour max for token sessions
                if (p.type === 'call') return p.remainingSeconds || 0;
                return 3 * 3600; // 3 hours max for chat sessions, balance is per message
            };

            if (type === 'call') {
                setActiveCallSession({
                    type: 'call',
                    listener: listener,
                    plan: planToUse.plan,
                    sessionDurationSeconds: sessionDurationSeconds(planToUse),
                    associatedPlanId: planToUse.id,
                    isTokenSession: !!planToUse.isTokenSession,
                });
            } else {
                setActiveChatSession({
                    type: 'chat',
                    listener: listener,
                    plan: planToUse.plan,
                    sessionDurationSeconds: sessionDurationSeconds(planToUse),
                    associatedPlanId: planToUse.id,
                    isTokenSession: !!planToUse.isTokenSession,
                });
            }
            setSelectedPlan(planToUse);
        } else {
            // No valid plan or tokens, show recharge modal
            setShowRechargeModal(true);
        }
    }, [purchasedPlans, balances.tokenBalance]);
    
    const handleCallSessionEnd = useCallback(async (success: boolean, consumedSeconds: number) => {
        if (selectedPlan && user && activeCallSession) {
            if (success && consumedSeconds > 0) {
                 if (!selectedPlan.isTokenSession) {
                    const planRef = db.collection('users').doc(user.uid).collection('purchasedPlans').doc(selectedPlan.id);
                    await planRef.update({
                        remainingSeconds: firebase.firestore.FieldValue.increment(-consumedSeconds)
                    });
                }
                
                await handleCallEnd(
                    activeCallSession.listener.id.toString(),
                    user.uid,
                    Math.ceil(consumedSeconds / 60)
                );
            }
        }
        setActiveCallSession(null);
        setSelectedPlan(null);
    }, [selectedPlan, user, activeCallSession]);

    const handleChatSessionEnd = useCallback(async (success: boolean, consumedMessages: number) => {
        if (user && activeChatSession) {
             if (success && consumedMessages > 0) {
                // Plan/token consumption is handled per-message in ChatUI
                await handleChat(
                    activeChatSession.listener.id.toString(),
                    user.uid,
                    consumedMessages
                );
            }
        }
        setActiveChatSession(null);
        setSelectedPlan(null);
    }, [user, activeChatSession]);
    
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
        return <CallUI session={activeCallSession} user={user} onLeave={handleCallSessionEnd} />;
    }

    if (activeChatSession) {
        return <ChatUI session={activeChatSession} user={user} onLeave={handleChatSessionEnd} />;
    }
    
    return (
        <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-900 flex flex-col min-h-screen shadow-2xl transition-colors duration-300">
            <Header currentUser={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} balances={balances} />
            <main className="flex-grow pb-20">
                {renderActiveView()}
            </main>
            <Footer activeView={activeView} setActiveView={setActiveView} />
            
            {/* Modals and Overlays */}
            {showInstallBanner && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 animate-fade-in-up">
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-2xl p-4 flex items-center gap-4 text-white relative">
                    <div className="bg-white/20 p-3 rounded-full shrink-0">
                      <InstallIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold">Install SakoonApp</p>
                      <p className="text-sm opacity-90">Install from the Profile tab for the best experience.</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveView('profile');
                        handleInstallDismiss(); // Hide banner after navigating
                      }}
                      className="bg-white text-cyan-700 font-bold py-2 px-4 rounded-lg text-sm shrink-0 hover:bg-cyan-100 transition-colors"
                    >
                      Go to Profile
                    </button>
                    <button onClick={handleInstallDismiss} className="absolute -top-2 -right-2 bg-slate-800/50 rounded-full p-1 hover:bg-slate-800/80 transition-colors">
                      <CloseIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
            )}
            <AICompanionButton onClick={() => setShowAICompanion(true)} />
            {showAICompanion && <AICompanion user={user} onClose={() => setShowAICompanion(false)} onNavigateToServices={() => { setActiveView('home'); setShowAICompanion(false); }} />}
            
            {showRechargeModal && (
                <RechargeModal
                    onClose={() => setShowRechargeModal(false)}
                    onNavigateHome={() => {
                        setActiveView('home');
                        setShowRechargeModal(false);
                    }}
                />
            )}

            {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
            {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
            {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
        </div>
    );
};

export default App;