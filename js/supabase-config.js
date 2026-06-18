// =============================================
// EARNNOVA BETA - Firebase + Supabase Config
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyAoo2-X5ILICXR2mFAyUhqJYpvScChlsOc",
  authDomain: "earnnovabeta.firebaseapp.com",
  projectId: "earnnovabeta",
  storageBucket: "earnnovabeta.firebasestorage.app",
  messagingSenderId: "458557664673",
  appId: "1:458557664673:web:12bfc1789f0c5ebe43afe0",
  measurementId: "G-BNWP93VWD4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== ADMIN CONSTANTS =====
const ADMIN_EMAIL = 'rafetnoob731@gmail.com';

// ===== FIRESTORE COLLECTIONS =====
const usersRef = db.collection('users');
const transactionsRef = db.collection('transactions');
const referralsRef = db.collection('referrals');
const adsRef = db.collection('ads');
const notificationsRef = db.collection('notifications');
const withdrawalsRef = db.collection('withdrawals');
const systemConfigRef = db.collection('system').doc('config');

// ===== SUPABASE (future) =====
let supabase = null;
let useSupabase = false;
