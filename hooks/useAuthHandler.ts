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

    /**
     * A generic handler for any authentication promise to reduce boilerplate.
     * Sets loading state and handles standardized error messages.
     * @param authPromise The async function from Firebase auth to execute.
     * @param errorMessages A map of Firebase error codes to user-friendly messages.
     */
    const handleAuthRequest = useCallback(async (authPromise: Promise<any>, errorMessages: { [key: string]: string }) => {
        setLoading(true);
        setError('');
        try {
            await authPromise;
            // On success, the onAuthStateChanged listener in App.tsx will handle the redirect.
        } catch (err: any) {
            console.error("Auth Error:", err.code, err.message);
            const message = errorMessages[err.code] || 'An unexpected error occurred. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const signInWithGoogle = useCallback(() => {
        setLoading(true);
        setError('');
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider).catch((err) => {
            // This handles immediate errors before the redirect occurs
            console.error("Auth Error (pre-redirect):", err.code, err.message);
            setError('Could not start Google sign-in. Please try again.');
            setLoading(false);
        });
    }, []);

    const handleEmailPasswordSubmit = useCallback((email, password, isSignUp) => {
        const promise = isSignUp
            ? auth.createUserWithEmailAndPassword(email, password)
            : auth.signInWithEmailAndPassword(email, password);
        
        handleAuthRequest(promise, {
            'auth/email-already-in-use': 'This email is already registered. Please log in.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email. Please sign up.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
        });
    }, [handleAuthRequest]);

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
             const messages = {
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
             const messages = {
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

    return { loading, error, signInWithGoogle, handleEmailPasswordSubmit, sendOtpToPhone, verifyOtp, clearError };
};