
import { useState, useCallback, useRef, useEffect } from 'react';
import { auth } from '../utils/firebase';
import firebase from 'firebase/compat/app';

/**
 * A custom hook to encapsulate all Firebase authentication logic.
 * Manages loading and error states for a cleaner UI component.
 */
export const useAuthHandler = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const confirmationResultRef = useRef<firebase.auth.ConfirmationResult | null>(null);

    // On mount, check if an auth error was passed from a redirect
    useEffect(() => {
        const authError = sessionStorage.getItem('authError');
        if (authError) {
            setError(authError);
            sessionStorage.removeItem('authError');
        }
    }, []);

    const signInWithGoogle = useCallback(() => {
        setLoading(true);
        setError('');
        const provider = new firebase.auth.GoogleAuthProvider();
        // FIX: Switched to signInWithPopup to avoid environment errors in sandboxed iframes.
        auth.signInWithPopup(provider)
            .catch((err) => {
                console.error("Google Popup Auth Error:", err.code, err.message);
                // Don't show an error if the user intentionally closes the popup.
                if (err.code !== 'auth/popup-closed-by-user') {
                    setError('Failed to sign in with Google. Please try again.');
                }
            })
            .finally(() => {
                 // The onAuthStateChanged listener handles success, so we just need to stop loading.
                setLoading(false);
            });
    }, []);

    const sendOtpToPhone = useCallback(async (phoneNumber: string) => {
        setLoading(true);
        setError('');
        
        // Ensure reCAPTCHA container exists
        if (!document.getElementById('recaptcha-container')) {
             const container = document.createElement('div');
             container.id = 'recaptcha-container';
             document.body.appendChild(container);
        }

        try {
            const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
            });
            const confirmationResult = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, appVerifier);
            confirmationResultRef.current = confirmationResult;
            return true; // Indicate success to the UI component
        } catch (err: any) {
             console.error("SMS sending error:", err);
             const messages: { [key: string]: string } = {
                'auth/too-many-requests': 'Too many attempts. Please try again later.',
                'auth/invalid-phone-number': 'Invalid phone number. Please check again.'
             };
             setError(messages[err.code] || 'Failed to send SMS. Check your network and try again.');
             return false; // Indicate failure
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyOtp = useCallback(async (otp: string) => {
        if (!confirmationResultRef.current) {
            setError('Verification session expired. Please try again.');
            return false;
        }
        setLoading(true);
        setError('');
        try {
            await confirmationResultRef.current.confirm(otp);
            return true;
        } catch (err: any) {
             console.error("OTP verification error:", err);
             const messages: { [key: string]: string } = {
                'auth/invalid-verification-code': 'Invalid OTP. Please check again.'
             };
             setError(messages[err.code] || 'OTP verification failed. Please try again.');
             return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error state manually
    const clearError = useCallback(() => setError(''), []);

    return { loading, error, signInWithGoogle, sendOtpToPhone, verifyOtp, clearError };
};
