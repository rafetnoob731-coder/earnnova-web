// Firebase Configuration - EARNNOVA BETA Web
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAoo2-X5ILICXR2mFAyUhqJYpvScChlsOc",
    authDomain: "earnnovabeta.firebaseapp.com",
    projectId: "earnnovabeta",
    storageBucket: "earnnovabeta.firebasestorage.app",
    messagingSenderId: "458557664673",
    appId: "1:458557664673:web:12bfc1789f0c5ebe43afe0",
    measurementId: "G-BNWP93VWD4"
};

// For modular SDK (v9+), uncomment and use these imports at the top of your script:
/*
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, collection, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
*/

// Using compat SDK (v8) for direct script tag usage:
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Analytics (optional)
const analytics = firebase.analytics();

// Enable Firestore offline persistence
db.enablePersistence()
    .then(() => console.log('Firestore persistence enabled'))
    .catch(err => console.warn('Firestore persistence error:', err));

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Constants
const ADMIN_EMAIL = 'rafetnoob731@gmail.com';

// Collection references
const usersRef = db.collection('users');
const transactionsRef = db.collection('transactions');
const referralsRef = db.collection('referrals');
const adsRef = db.collection('ads');
const notificationsRef = db.collection('notifications');
const withdrawalsRef = db.collection('withdrawals');
const systemConfigRef = db.collection('system').doc('config');

console.log('✓ EARNNOVA Firebase initialized (Web App)');
console.log('  Project:', firebaseConfig.projectId);
console.log('  App ID:', firebaseConfig.appId);
