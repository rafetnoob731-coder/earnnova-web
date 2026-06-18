// =============================================
// EARNNOVA BETA - Supabase + Firebase Config
// =============================================

// FIREBASE CONFIG (keep for auth)
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

// SUPABASE CONFIG (your Supabase project)
// REPLACE these with your actual Supabase URL and anon key
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

// Initialize Supabase
let supabase = null;
let useSupabase = false;

try {
  if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    console.log('Supabase connected');
  }
} catch (e) {
  console.warn('Supabase not available, using Firestore');
}

// FALLBACK: Use Firestore if Supabase is not configured
if (!useSupabase) {
  console.log('Using Firestore as database');
}

// CONSTANTS
const ADMIN_EMAIL = 'rafetnoob731@gmail.com';

// COLLECTION REFS (Firestore fallback)
const usersRef = db.collection('users');
const transactionsRef = db.collection('transactions');
const referralsRef = db.collection('referrals');
const adsRef = db.collection('ads');
const notificationsRef = db.collection('notifications');
const withdrawalsRef = db.collection('withdrawals');
const systemConfigRef = db.collection('system').doc('config');
