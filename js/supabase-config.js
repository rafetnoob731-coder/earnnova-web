// =============================================
// EARNNOVA BETA - Firebase + Supabase Config
// =============================================

// Guard: show auth page immediately if Firebase SDK is missing
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded');
  setTimeout(function() {
    var s = document.getElementById('splash');
    if (s) s.classList.add('hide');
    var ap = document.getElementById('authPage');
    if (ap) ap.classList.remove('hidden');
  }, 100);
  // Set dummy globals to prevent ReferenceError crashes in auth.js / app.js
  var ADMIN_EMAIL = 'rafetnoob731@gmail.com';
  var auth = { onAuthStateChanged:function(){}, signInWithEmailAndPassword:function(){return Promise.reject()}, createUserWithEmailAndPassword:function(){return Promise.reject()}, signOut:function(){}, sendPasswordResetEmail:function(){} };
  // Simple mock that returns empty snapshots for all Firestore calls
  var emptySnap = { exists:false, data:function(){return null}, size:0, empty:true, forEach:function(){} };
  var emptyDoc = { get:function(){return Promise.resolve(emptySnap)}, set:function(){}, update:function(){}, delete:function(){} };
  var emptyCol = { doc:function(){return emptyDoc}, where:function(){return emptyCol}, orderBy:function(){return emptyCol}, limit:function(){return emptyCol}, get:function(){return Promise.resolve(emptySnap)}, add:function(){return Promise.resolve()} };
  var db = { collection:function(){return emptyCol} };
  var usersRef = emptyCol;
  var transactionsRef = emptyCol;
  var referralsRef = emptyCol;
  var adsRef = emptyCol;
  var notificationsRef = emptyCol;
  var withdrawalsRef = emptyCol;
  var systemConfigRef = emptyDoc;
  var supabase = null;
  var useSupabase = false;
} else {
  var firebaseConfig = {
    apiKey: "AIzaSyAoo2-X5ILICXR2mFAyUhqJYpvScChlsOc",
    authDomain: "earnnovabeta.firebaseapp.com",
    projectId: "earnnovabeta",
    storageBucket: "earnnovabeta.firebasestorage.app",
    messagingSenderId: "458557664673",
    appId: "1:458557664673:web:12bfc1789f0c5ebe43afe0",
    measurementId: "G-BNWP93VWD4"
  };

  firebase.initializeApp(firebaseConfig);

  // Use var for globals so they're accessible in auth.js & app.js
  var auth = firebase.auth();
  var db = firebase.firestore();

  // ===== ADMIN CONSTANTS =====
  var ADMIN_EMAIL = 'rafetnoob731@gmail.com';

  // ===== FIRESTORE COLLECTIONS =====
  var usersRef = db.collection('users');
  var transactionsRef = db.collection('transactions');
  var referralsRef = db.collection('referrals');
  var adsRef = db.collection('ads');
  var notificationsRef = db.collection('notifications');
  var withdrawalsRef = db.collection('withdrawals');
  var systemConfigRef = db.collection('system').doc('config');

  // ===== SUPABASE (future) =====
  var supabase = null;
  var useSupabase = false;
}
