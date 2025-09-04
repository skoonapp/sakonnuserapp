import React, { useState, useEffect } from 'react';
import { useAuthHandler } from '../hooks/useAuthHandler';

// --- Icon Components ---
const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);
const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.534-11.082-8.464l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 31.134 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);
const GiftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.75 3.375a.75.75 0 00-1.5 0V4.5h1.5V3.375z" />
        <path fillRule="evenodd" d="M6.303 4.876A2.25 2.25 0 018.625 4.5h6.75a2.25 2.25 0 012.322.376l.322.427.323.427a2.25 2.25 0 010 2.848l-.323.427-.322.427a2.25 2.25 0 01-2.322.377H8.625a2.25 2.25 0 01-2.322-.377l-.322-.427-.323-.427a2.25 2.25 0 010-2.848l.323-.427.322-.427zM8.625 6a.75.75 0 00-.774.125l-.323.427-.322.427a.75.75 0 000 .949l.322.427.323.427a.75.75 0 00.774.125h6.75a.75.75 0 00.774-.125l.323-.427.322-.427a.75.75 0 000-.949l-.322-.427-.323-.427a.75.75 0 00-.774-.125H8.625z" clipRule="evenodd" />
        <path d="M12 9.75a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V10.5a.75.75 0 01.75-.75z" />
        <path d="M4.125 12.375a2.25 2.25 0 012.25-2.25h11.25a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25-2.25H6.375a2.25 2.25 0 01-2.25-2.25v-8.25zM6.375 13.5v7.5h11.25v-7.5H6.375z" />
    </svg>
);
// --- End Icon Components ---


const LoginScreen: React.FC = () => {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    
    // Resend OTP State
    const [resendTimer, setResendTimer] = useState(60);
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [resendAttempts, setResendAttempts] = useState(0);
    
    const { loading, error, signInWithGoogle, sendOtpToPhone, verifyOtp, clearError } = useAuthHandler();
    
    // OTP Countdown Timer Effect
    useEffect(() => {
        let interval: number;
        if (step === 'otp' && resendTimer > 0) {
            setCanResendOtp(false);
            interval = window.setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else if (step === 'otp' && resendTimer === 0) {
            setCanResendOtp(true);
        }

        return () => {
            if (interval) {
                window.clearInterval(interval);
            }
        };
    }, [step, resendTimer]);


    const onPhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Reset resend state for a new submission attempt
        setResendTimer(60);
        setCanResendOtp(false);
        setResendAttempts(0);

        const success = await sendOtpToPhone(phoneNumber);
        if (success) {
            setStep('otp');
        }
    };

    const onOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await verifyOtp(otp);
    };

    const handleResendOtp = async () => {
        if (!canResendOtp || resendAttempts >= 2 || loading) return;

        setCanResendOtp(false);
        const success = await sendOtpToPhone(phoneNumber);

        if (success) {
            const newAttempts = resendAttempts + 1;
            setResendAttempts(newAttempts);
            // Set next timer duration: 180s for the second attempt
            setResendTimer(newAttempts === 1 ? 180 : 0); 
        } else {
            // If sending fails, allow user to try again without waiting
            setCanResendOtp(true);
        }
    };

    const renderContent = () => {
        if (step === 'otp') {
            return (
                <div className="w-full max-w-sm">
                    <h2 className="text-3xl font-bold text-white mb-2">OTP दर्ज करें</h2>
                    <p className="text-cyan-200 mb-8">+91 {phoneNumber} पर भेजा गया 6-अंकीय कोड दर्ज करें।</p>
                    <form onSubmit={onOtpSubmit} className="bg-slate-900/60 backdrop-blur-sm border border-white/20 p-6 md:p-8 rounded-2xl">
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                                <LockIcon className="w-5 h-5"/>
                            </div>
                            <input
                                type="tel"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="6-अंकीय OTP"
                                className="w-full bg-slate-800/30 border border-white/20 text-white placeholder-cyan-300/50 text-lg rounded-xl tracking-[0.5em] text-center p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none"
                                required
                            />
                        </div>
                        {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mb-4">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800">
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        
                        <div className="mt-6 text-center">
                            {resendAttempts < 2 ? (
                                canResendOtp ? (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-cyan-200 hover:text-white font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                ) : (
                                    <p className="text-slate-400">
                                        Resend OTP in {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                                    </p>
                                )
                            ) : (
                                 <div className="text-center text-cyan-200 bg-slate-800/50 p-4 rounded-lg">
                                    <p className="mb-3">OTP resend limit reached.</p>
                                    <button
                                        type="button"
                                        onClick={signInWithGoogle}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-2.5 rounded-lg transition-colors hover:bg-slate-200 disabled:bg-slate-300"
                                    >
                                        <GoogleIcon />
                                        <span>Sign in with Google instead</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                    <button onClick={() => { setStep('form'); clearError(); }} className="mt-4 text-cyan-200 hover:text-white">गलत नंबर? वापस जाएं</button>
                </div>
            );
        }

        return (
             <div className="w-full max-w-sm">
                <div className="mb-8 text-center text-cyan-200 text-sm p-4 animate-float">
                    <GiftIcon className="w-8 h-8 mx-auto mb-2 text-yellow-300"/>
                    <p>नए यूज़र्स को मिलते हैं <strong>5 मुफ़्त मैसेज</strong>!</p>
                </div>
                
                <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-6xl font-bold text-white animate-title-glow">SakoonApp</h1>
                    <p className="mt-4 text-lg md:text-xl text-cyan-200">अकेलापन अब बीतेगा, सकून से जी पाएगा</p>
                </div>

                <div className="w-full bg-slate-900/60 backdrop-blur-sm border border-white/20 p-6 md:p-8 rounded-2xl">
                    <h2 className="text-center font-bold text-white text-xl mb-6">लॉग इन करें</h2>
                     <form onSubmit={onPhoneSubmit}>
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400"><PhoneIcon className="w-5 h-5" /><span className="ml-2">+91</span></div>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="मोबाइल नंबर" className="w-full bg-slate-800/30 border border-white/20 text-white placeholder-cyan-300/50 text-lg rounded-xl block pl-20 p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800">
                            {loading ? 'OTP भेजा जा रहा है...' : 'OTP पाएं'}
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-white/20" />
                        <span className="px-4 text-slate-400">या</span>
                        <hr className="flex-grow border-white/20" />
                    </div>

                    <button onClick={signInWithGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-3.5 rounded-xl transition-colors hover:bg-slate-200 disabled:bg-slate-300">
                        <GoogleIcon/>
                        <span>Google से जारी रखें</span>
                    </button>
                    {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-no-repeat opacity-20 animate-ken-burns" 
                    style={{backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop')`}}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                {renderContent()}
            </div>
            
            <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500 z-10 px-4">
                <p>SakoonApp by Metxfitt Pvt. Ltd. | © 2025 All Rights Reserved</p>
                <p>Contact: support@sakoonapp.com | Follow us: @SakoonApp</p>
            </footer>
        </div>
    );
};

export default React.memo(LoginScreen);