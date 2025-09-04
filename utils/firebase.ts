// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/messaging';
import 'firebase/compat/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgrba11-ZmbE6f3BIYfNc_tKLv32osWuU",
  authDomain: "sakoonapp-9574c.firebaseapp.com",
  databaseURL: "https://sakoonapp-9574c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sakoonapp-9574c",
  storageBucket: "sakoonapp-9574c.appspot.com",
  messagingSenderId: "747287490572",
  appId: "1:747287490572:web:7053dc7758c622498a3e29",
  measurementId: "G-6VD83ZC2HP"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// FIX: Set authentication persistence to 'local' to ensure user remains logged in.
// 'local' uses localStorage and persists across browser sessions/tabs, which is
// the expected behavior for a PWA or web app that users "install".
// This prevents the user from being logged out automatically after closing the app.
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    // Handle errors here (e.g., if localStorage is disabled).
    console.error("Auth persistence error:", error.code, error.message);
  });


export const auth = firebase.auth();
export const db = firebase.firestore();
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const functions = firebase.functions();

// Initialize and export messaging, checking for browser support.
export const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;