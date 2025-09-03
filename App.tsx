import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { User, Listener, ActivePlan, CallSession, ChatSession, ActiveView } from './types';
import { auth, db, functions } from './utils/firebase';
import { handleCallEnd, handleChat } from './utils/earnings';
import { useWallet } from './hooks/useWallet';

// Import Components
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import AICompanionButton from './components/AICompanionButton';
import CallUI from './components/CallUI';
import ChatUI from './components/ChatUI';
import RechargeModal from './components/RechargeModal';
import ViewLoader from './components/ViewLoader';

// --- Lazy Load Views and Modals for Code Splitting ---
const PlansView = lazy(() => import('./components/Listeners')); // This is the home/plans view
const CallsView = lazy(() => import('./components/Services'));
const ChatsView = lazy(() => import('./components/LiveFeedback')); // This is the chats view
const ProfileView = lazy(() => import('./components/About'));
const AICompanion = lazy(() => import('./components/AICompanion'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const CancellationRefundPolicy = lazy(() => import('./components/CancellationRefundPolicy'));


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
    const [isInitializing, setIsInitializing] = useState(true); // State to track initial auth check
    const wallet = useWallet(user); // Pass user to the refactored hook

    // Navigation State
    const [activeView, setActiveView] = useState<ActiveView>('home');
    
    // UI State
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAICompanion, setShowAICompanion] = useState(false);
    const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'cancellation' | null>(null);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    
    // Session State
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

    // FIX: Refactored Auth and Data Listener Effect for reliability
    useEffect(() => {
        let unsubscribeUser: () => void = () => {};

        // Handle redirect result from OAuth providers like Google.
        // This runs once on app load and checks if the user is returning from a sign-in flow.
        auth.getRedirectResult().catch((error) => {
            console.error("Auth Redirect Error:", error.code, error.message);
            // Store error to be displayed by the LoginScreen component.
            sessionStorage.setItem('authError', 'Failed to sign in with Google. Please try again.');
        });

        const unsubscribeAuth = auth.onAuthStateChanged(firebaseUser => {
            unsubscribeUser(); // Clean up previous Firestore listener if it exists

            if (firebaseUser) {
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                
                unsubscribeUser = userDocRef.onSnapshot(doc => {
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
                            tokens: 0,
                            activePlans: [],
                            freeMessagesRemaining: 5,
                        };
                        userDocRef.set(newUser, { merge: true });
                        setUser(newUser);
                    }
                    setIsInitializing(false); // Initialization is complete once we have user data
                }, error => {
                    console.error("Error fetching user document:", error);
                    setUser(null);
                    setIsInitializing(false);
                });

            } else {
                // User is signed out
                setUser(null);
                setIsInitializing(false);
            }
        });

        // Cleanup for the component unmount
        return () => {
            unsubscribeAuth();
            unsubscribeUser();
        };
    }, []);


    // Handlers
    const handleLogout = useCallback(() => {
        auth.signOut();
    }, []);
    
    const handleStartSession = useCallback((type: 'call' | 'chat', listener: Listener) => {
        if (type === 'chat' && user && (user.freeMessagesRemaining || 0) > 0) {
            setActiveChatSession({
                type: 'chat',
                listener: listener,
                plan: { duration: 'Free Trial', price: 0 },
                sessionDurationSeconds: 3 * 3600,
                associatedPlanId: `free_trial_${user.uid}`,
                isTokenSession: false,
                isFreeTrial: true,
            });
            return;
        }
        
        const now = Date.now();
        const activePlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > now);

        // Priority 1: Find an active DT plan
        const dtPlan = activePlans.find(p => 
            p.type === type && 
            ((type === 'call' && (p.minutes || 0) > 0) || 
             (type === 'chat' && (p.messages || 0) > 0))
        );

        let sessionPlan: ActivePlan | null = null;
        let isTokenSession = false;

        if (dtPlan) {
            sessionPlan = dtPlan;
        } else {
            // Priority 2: Check for tokens
            const canUseTokens = (type === 'call' && (wallet.tokens || 0) >= 2) || (type === 'chat' && (wallet.tokens || 0) >= 0.5);
            if (canUseTokens) {
                isTokenSession = true;
            }
        }

        if (sessionPlan || isTokenSession) {
             const associatedPlanId = sessionPlan ? sessionPlan.id : `mt_session_${now}`;
             if (type === 'call') {
                setActiveCallSession({
                    type: 'call',
                    listener: listener,
                    plan: { duration: sessionPlan?.name || 'MT', price: sessionPlan?.price || 0 },
                    sessionDurationSeconds: 3600, // Max duration 1hr
                    associatedPlanId: associatedPlanId,
                    isTokenSession: isTokenSession,
                });
            } else { // chat
                setActiveChatSession({
                    type: 'chat',
                    listener: listener,
                    plan: { duration: sessionPlan?.name || 'MT', price: sessionPlan?.price || 0 },
                    sessionDurationSeconds: 3 * 3600, // Max duration 3hr
                    associatedPlanId: associatedPlanId,
                    isTokenSession: isTokenSession,
                });
            }
        } else {
            // No valid plan or tokens
            setShowRechargeModal(true);
        }
    }, [wallet, user]);
    
    const handleCallSessionEnd = useCallback(async (success: boolean, consumedSeconds: number) => {
        if (user && activeCallSession) {
            if (success && consumedSeconds > 5) { // Only deduct if call lasted more than 5 seconds
                 try {
                    const finalizeCall = functions.httpsCallable('finalizeCallSession');
                    await finalizeCall({ consumedSeconds, associatedPlanId: activeCallSession.associatedPlanId });
                } catch (error) {
                    console.error("Failed to finalize call session on backend:", error);
                    // Optionally show an error to the user
                }

                // Record earnings for the listener regardless of deduction success
                await handleCallEnd(
                    activeCallSession.listener.id.toString(),
                    user.uid,
                    Math.ceil(consumedSeconds / 60)
                );
            }
        }
        setActiveCallSession(null);
    }, [user, activeCallSession]);

    const handleChatSessionEnd = useCallback(async (success: boolean, consumedMessages: number) => {
        if (user && activeChatSession) {
             if (success && consumedMessages > 0 && !activeChatSession.isFreeTrial) {
                // Balance deduction is handled per-message in ChatUI
                await handleChat(
                    activeChatSession.listener.id.toString(),
                    user.uid,
                    consumedMessages
                );
            }
        }
        setActiveChatSession(null);
    }, [user, activeChatSession]);

    // PERF: Memoize callback functions for AI Companion to prevent re-initialization.
    const handleCloseAICompanion = useCallback(() => {
        setShowAICompanion(false);
    }, []);

    const handleNavigateToServices = useCallback(() => {
        setActiveView('calls');
        setShowAICompanion(false);
    }, []);
    
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
    
    // FIX: Updated loading check to be more robust.
    if (isInitializing || wallet.loading) {
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
        <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-950 flex flex-col min-h-screen shadow-2xl transition-colors duration-300">
            <Header currentUser={user} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} wallet={wallet} />
            <main className="flex-grow pb-20">
                <Suspense fallback={<ViewLoader />}>
                    {renderActiveView()}
                </Suspense>
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
            
            <Suspense fallback={null}>
                {showAICompanion && <AICompanion user={user} onClose={handleCloseAICompanion} onNavigateToServices={handleNavigateToServices} />}
                
                {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
            </Suspense>

            {showRechargeModal && (
                <RechargeModal
                    onClose={() => setShowRechargeModal(false)}
                    onNavigateHome={() => {
                        setActiveView('home');
                        setShowRechargeModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default App;