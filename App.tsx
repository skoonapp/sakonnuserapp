import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { User, Listener, CallSession, ChatSession, ActiveView } from './types';
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
import WelcomeModal from './components/WelcomeModal';

// --- Lazy Load Views for Code Splitting ---
const HomeView = lazy(() => import('./components/Listeners'));
const CallsView = lazy(() => import('./components/Services'));
const ChatsView = lazy(() => import('./components/LiveFeedback'));
const ProfileView = lazy(() => import('./components/About'));
const AICompanion = lazy(() => import('./components/AICompanion'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const CancellationRefundPolicy = lazy(() => import('./components/CancellationRefundPolicy'));
const Wallet = lazy(() => import('./components/Wallet'));

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

// --- Main App Component ---
const App: React.FC = () => {
    // --- State Management ---
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const wallet = useWallet(user);

    // --- PWA & Layout State ---
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // --- UI State ---
    const [showAICompanion, setShowAICompanion] = useState(false);
    const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'cancellation' | null>(null);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showWallet, setShowWallet] = useState(false);
    const [initialWalletTab, setInitialWalletTab] = useState<'recharge' | 'usage'>('recharge');
    
    // --- Session State ---
    const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
    
    // --- WhatsApp-like Navigation State ---
    const views: ActiveView[] = ['home', 'calls', 'chats', 'profile'];
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);
    const swipeThreshold = 50; // Min pixels to trigger a swipe

    // --- Effects ---

    // Hide initial static splash screen
    useEffect(() => {
        const splashElement = document.getElementById('static-splash-screen');
        if (splashElement) {
            splashElement.style.opacity = '0';
            splashElement.addEventListener('transitionend', () => splashElement.remove());
        }
    }, []);
    
    // PWA Install prompt listener
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Show/hide PWA install banner
    useEffect(() => {
        const expiryString = localStorage.getItem('pwaInstallDismissedExpiry');
        if (expiryString && new Date().getTime() > Number(expiryString)) {
            localStorage.removeItem('pwaInstallDismissed');
            localStorage.removeItem('pwaInstallDismissedExpiry');
        }
        const isDismissed = localStorage.getItem('pwaInstallDismissed');
        setShowInstallBanner(!!deferredInstallPrompt && !isDismissed);
    }, [deferredInstallPrompt]);
    
    // Dark Mode management
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

    // Auth state and user data listener
    useEffect(() => {
        let unsubscribeUser: () => void = () => {};
        const unsubscribeAuth = auth.onAuthStateChanged(firebaseUser => {
            unsubscribeUser();
            if (firebaseUser) {
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                unsubscribeUser = userDocRef.onSnapshot(doc => {
                    if (doc.exists) {
                        const userData = doc.data() as User;
                        setUser(userData);
                        if (userData.hasSeenWelcome === false || userData.hasSeenWelcome === undefined) {
                            setShowWelcomeModal(true);
                        }
                    } else {
                        const newUser: User = { uid: firebaseUser.uid, name: firebaseUser.displayName || 'New User', email: firebaseUser.email, mobile: firebaseUser.phoneNumber || '', favoriteListeners: [], tokens: 0, activePlans: [], freeMessagesRemaining: 5, hasSeenWelcome: false };
                        userDocRef.set(newUser, { merge: true });
                        setUser(newUser);
                        setShowWelcomeModal(true);
                    }
                    setIsInitializing(false);
                }, error => {
                    console.error("Error fetching user document:", error);
                    setUser(null);
                    setIsInitializing(false);
                });
            } else {
                setUser(null);
                setIsInitializing(false);
            }
        });
        return () => {
            unsubscribeAuth();
            unsubscribeUser();
        };
    }, []);
    
    // --- PWA Back Button Handling ---
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // When user hits back button, always go to the home screen as per the prompt.
            setActiveIndex(0);
        };
        // Set initial state.
        window.history.replaceState({ activeIndex: 0 }, '');

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);


    // --- Handlers ---
    
    // Main navigation handler for clicks, swipes, and history
    const navigateTo = useCallback((newIndex: number) => {
        const currentIndex = activeIndex;
        if (newIndex === currentIndex) return;

        // Manage browser history for native back button behavior
        if (currentIndex === 0 && newIndex > 0) {
            // Moving from home to an inner view: PUSH a new state
            window.history.pushState({ activeIndex: newIndex }, '');
        } else if (currentIndex > 0 && newIndex > 0) {
            // Moving between inner views: REPLACE the state to avoid long back-button chains
            window.history.replaceState({ activeIndex: newIndex }, '');
        } else if (currentIndex > 0 && newIndex === 0) {
            // Moving from an inner view back to home (e.g., via footer button)
            window.history.back(); // This triggers our popstate listener
            return; // popstate listener will set active index
        }
        
        setActiveIndex(newIndex);
    }, [activeIndex]);

    // Swipe Navigation Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEndX(0); // Clear previous swipe
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const deltaX = touchStartX - touchEndX;

        if (deltaX > swipeThreshold) { // Swiped left
            navigateTo((activeIndex + 1) % views.length);
        } else if (deltaX < -swipeThreshold) { // Swiped right
            navigateTo((activeIndex - 1 + views.length) % views.length);
        }
        // Reset touch positions
        setTouchStartX(0);
        setTouchEndX(0);
    };
    
    const handleInstallClick = useCallback(() => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then(() => {
                setDeferredInstallPrompt(null);
                setShowInstallBanner(false);
            });
        }
    }, [deferredInstallPrompt]);

    const handleInstallDismiss = () => {
        const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('pwaInstallDismissed', 'true');
        localStorage.setItem('pwaInstallDismissedExpiry', String(expiry));
        setShowInstallBanner(false);
    };

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
    
    const handleLogout = useCallback(() => auth.signOut(), []);
    
    const handleCloseWelcomeModal = useCallback(async () => {
        if (user) {
            try {
                await db.collection('users').doc(user.uid).update({ hasSeenWelcome: true });
            } catch (error) {
                console.error("Error updating welcome status:", error);
            } finally {
                 setShowWelcomeModal(false);
                 if (deferredInstallPrompt) handleInstallClick();
            }
        }
    }, [user, deferredInstallPrompt, handleInstallClick]);

    const handleStartSession = useCallback((type: 'call' | 'chat', listener: Listener) => {
        if (type === 'chat' && user && (user.freeMessagesRemaining || 0) > 0) {
            setActiveChatSession({ type: 'chat', listener, plan: { duration: 'Free Trial', price: 0 }, sessionDurationSeconds: 3 * 3600, associatedPlanId: `free_trial_${user.uid}`, isTokenSession: false, isFreeTrial: true });
            return;
        }
        
        const activePlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > Date.now());
        const dtPlan = activePlans.find(p => p.type === type && ((type === 'call' && (p.minutes || 0) > 0) || (type === 'chat' && (p.messages || 0) > 0)));

        if (dtPlan) {
            const session = { listener, plan: { duration: dtPlan.name || 'Plan', price: dtPlan.price || 0 }, associatedPlanId: dtPlan.id, isTokenSession: false };
            if (type === 'call') setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: 3600 });
            else setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
        } else {
            const canUseTokens = (type === 'call' && (wallet.tokens || 0) >= 2) || (type === 'chat' && (wallet.tokens || 0) >= 0.5);
            if (canUseTokens) {
                const session = { listener, plan: { duration: 'MT', price: 0 }, associatedPlanId: `mt_session_${Date.now()}`, isTokenSession: true };
                if (type === 'call') setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: 3600 });
                else setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
            } else {
                setShowRechargeModal(true);
            }
        }
    }, [wallet, user]);
    
    const handleCallSessionEnd = useCallback(async (success: boolean, consumedSeconds: number) => {
        if (user && activeCallSession) {
            if (success && consumedSeconds > 5) {
                try {
                    const finalizeCall = functions.httpsCallable('finalizeCallSession');
                    await finalizeCall({ consumedSeconds, associatedPlanId: activeCallSession.associatedPlanId });
                    await handleCallEnd(activeCallSession.listener.id.toString(), user.uid, Math.ceil(consumedSeconds / 60));
                } catch (error) {
                    console.error("Failed to finalize call session:", error);
                }
            }
        }
        setActiveCallSession(null);
    }, [user, activeCallSession]);

    const handleChatSessionEnd = useCallback(async (success: boolean, consumedMessages: number) => {
        if (user && activeChatSession) {
            if (success && consumedMessages > 0 && !activeChatSession.isFreeTrial) {
                await handleChat(activeChatSession.listener.id.toString(), user.uid, consumedMessages);
            }
        }
        setActiveChatSession(null);
    }, [user, activeChatSession]);
    
    const handleWalletOpen = useCallback((tab: 'recharge' | 'usage') => {
        setInitialWalletTab(tab);
        setShowWallet(true);
    }, []);

    // --- Render Logic ---
    
    if (isInitializing || wallet.loading) return <SplashScreen />;
    if (!user) return <LoginScreen />;
    if (activeCallSession) return <CallUI session={activeCallSession} user={user} onLeave={handleCallSessionEnd} />;
    if (activeChatSession) return <ChatUI session={activeChatSession} user={user} onLeave={handleChatSessionEnd} />;
    
    const viewComponents = [
        <HomeView 
            currentUser={user} 
            wallet={wallet} 
            onWalletClick={handleWalletOpen}
        />,
        <CallsView onStartSession={handleStartSession} currentUser={user} />,
        <ChatsView onStartSession={handleStartSession} currentUser={user} />,
        <ProfileView 
            currentUser={user}
            onShowTerms={() => setShowPolicy('terms')}
            onShowPrivacyPolicy={() => setShowPolicy('privacy')}
            onShowCancellationPolicy={() => setShowPolicy('cancellation')}
            deferredPrompt={deferredInstallPrompt}
            onInstallClick={handleInstallClick}
            onLogout={handleLogout}
        />
    ];

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-950 flex flex-col h-screen shadow-2xl transition-colors duration-300 overflow-hidden">
            <Header 
                isDarkMode={isDarkMode} 
                toggleDarkMode={toggleDarkMode} 
                wallet={wallet}
            />
            
            <main
                className="flex-grow overflow-hidden pt-16 pb-16" // Main container hides overflow for swiping
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Suspense fallback={<ViewLoader />}>
                     <div className="swipe-container" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                        {viewComponents.map((view, index) => (
                           <div key={views[index]} className="swipe-view">
                               {view}
                           </div>
                        ))}
                     </div>
                </Suspense>
            </main>
            
            <Footer activeIndex={activeIndex} setActiveIndex={navigateTo} />
            
            {/* --- Modals and Overlays --- */}
            {showWelcomeModal && user && <WelcomeModal user={user} onClose={handleCloseWelcomeModal} />}
            {showInstallBanner && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 animate-fade-in-up">
                    <button onClick={handleInstallClick} className="w-full text-left bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-2xl p-2.5 flex items-center gap-3 text-white relative transition-transform hover:scale-105">
                        <div className="bg-white/20 p-2 rounded-full shrink-0"><InstallIcon className="w-5 h-5" /></div>
                        <div className="flex-grow">
                            <p className="font-bold text-sm">Install SakoonApp</p>
                            <p className="text-xs opacity-90">Add to home screen for quick access.</p>
                        </div>
                        <span className="bg-white text-cyan-700 font-bold py-1.5 px-3 rounded-lg text-xs shrink-0">Install</span>
                        <button onClick={(e) => { e.stopPropagation(); handleInstallDismiss(); }} className="absolute -top-2 -right-2 bg-slate-800/50 rounded-full p-1 hover:bg-slate-800/80 transition-colors" aria-label="Dismiss install banner">
                            <CloseIcon className="w-4 h-4 text-white" />
                        </button>
                    </button>
                </div>
            )}
            <AICompanionButton onClick={() => setShowAICompanion(true)} />
            
            <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><ViewLoader /></div>}>
                {showWallet && <Wallet wallet={wallet} onClose={() => setShowWallet(false)} onNavigateHome={() => { setShowWallet(false); navigateTo(0); }} initialTab={initialWalletTab} />}
                {showAICompanion && <AICompanion user={user} onClose={() => setShowAICompanion(false)} onNavigateToServices={() => { navigateTo(1); setShowAICompanion(false); }} />}
                {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
            </Suspense>

            {showRechargeModal && (
                <RechargeModal onClose={() => setShowRechargeModal(false)} onNavigateHome={() => { navigateTo(0); setShowRechargeModal(false); }} />
            )}
        </div>
    );
};

export default App;