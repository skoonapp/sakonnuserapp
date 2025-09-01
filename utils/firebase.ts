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

// Set authentication persistence to 'local' to keep the user signed in.
// This ensures that the user's session is persisted across browser sessions
// until they explicitly sign out.
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    // Handle errors here.
    console.error("Auth persistence error:", error.code, error.message);
  });


export const auth = firebase.auth();
export const db = firebase.firestore();
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const functions = firebase.functions();

// Initialize and export messaging, checking for browser support.
export const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;