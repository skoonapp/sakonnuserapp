

// FIX: Changed to Firebase v8 compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// FIX: Inlined env type definition to avoid intermittent global type conflicts.
// Define types for import.meta.env to handle Vite's environment variables.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_KEY?: string;
      readonly VITE_AUTH_DOMAIN?: string;
      readonly VITE_PROJECT_ID?: string;
      readonly VITE_STORAGE_BUCKET?: string;
      readonly VITE_MESSAGING_SENDER_ID?: string;
      readonly VITE_APP_ID?: string;
      readonly VITE_MEASUREMENT_ID?: string;
    };
  }
}

// Fallback configuration for local development.
const FALLBACK_CONFIG = {
    apiKey: "AIzaSyDgrba11-ZmbE6f3BIYfNc_tKLv32osWuU",
    authDomain: "sakoonapp-9574c.firebaseapp.com",
    projectId: "sakoonapp-9574c",
    storageBucket: "sakoonapp-9574c.appspot.com",
    messagingSenderId: "747287490572",
    appId: "1:747287490572:web:7053dc7758c622498a3e29",
    measurementId: "G-6VD83ZC2HP"
};


// Your web app's Firebase configuration.
// It prioritizes Vite's environment variables but uses a fallback for robustness.
const firebaseConfig = {
    apiKey: import.meta.env?.VITE_API_KEY || FALLBACK_CONFIG.apiKey,
    authDomain: import.meta.env?.VITE_AUTH_DOMAIN || FALLBACK_CONFIG.authDomain,
    projectId: import.meta.env?.VITE_PROJECT_ID || FALLBACK_CONFIG.projectId,
    storageBucket: import.meta.env?.VITE_STORAGE_BUCKET || FALLBACK_CONFIG.storageBucket,
    messagingSenderId: import.meta.env?.VITE_MESSAGING_SENDER_ID || FALLBACK_CONFIG.messagingSenderId,
    appId: import.meta.env?.VITE_APP_ID || FALLBACK_CONFIG.appId,
    measurementId: import.meta.env?.VITE_MEASUREMENT_ID || FALLBACK_CONFIG.measurementId
};


// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

const db = firebase.firestore();

// NOTE: The previous logic for persistence with multiple tabs is now handled by
// passing { synchronizeTabs: true } to enablePersistence, which is the v8 equivalent.
try {
    db.enablePersistence({ synchronizeTabs: true });
} catch (err: any) {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: The browser does not support all features required.');
    }
}

const auth = firebase.auth();

export { app, db, auth };