// =============================================
// EARNNOVA — Firebase Configuration
// =============================================

var ADMIN_EMAIL = 'owner@nova.com';
var IS_FIREBASE_READY = false;

// ===== FIREBASE CONFIG =====
var firebaseConfig = {
  apiKey: "AIzaSyAoo2-X5ILICXR2mFAyUhqJYpvScChlsOc",
  authDomain: "earnnovabeta.firebaseapp.com",
  projectId: "earnnovabeta",
  storageBucket: "earnnovabeta.firebasestorage.app",
  messagingSenderId: "458557664673",
  appId: "1:458557664673:web:12bfc1789f0c5ebe43afe0",
  measurementId: "G-BNWP93VWD4"
};

// ===== Initialize Firebase =====
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    IS_FIREBASE_READY = true;
  } catch(e) {
    console.error('Firebase init error:', e);
  }
}

// ===== Firebase Globals =====
var auth = IS_FIREBASE_READY ? firebase.auth() : null;
var db = IS_FIREBASE_READY ? firebase.firestore() : null;

// Collection refs
var usersRef = db ? db.collection('users') : null;
var transactionsRef = db ? db.collection('transactions') : null;
var referralsRef = db ? db.collection('referrals') : null;
var adsRef = db ? db.collection('ads') : null;
var notificationsRef = db ? db.collection('notifications') : null;
var withdrawalsRef = db ? db.collection('withdrawals') : null;
var systemConfigRef = db ? db.collection('system').doc('config') : null;

// ===== Firestore Timeout Helper =====
function fbTimeout(promise, ms) {
  return Promise.race([promise, new Promise(function(_, reject) {
    setTimeout(function() { reject(new Error('TIMEOUT')); }, ms || 8000);
  })]);
}

// ===== Auth Error Messages =====
function getAuthError(error) {
  var messages = {
    'auth/user-not-found': 'No account with this email',
    'auth/wrong-password': 'Invalid password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be 6+ characters',
    'auth/invalid-email': 'Please enter a valid email',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/unauthorized-domain': 'Domain not authorized. Contact support.',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'This sign-in method is not enabled'
  };
  return messages[error.code] || error.message || 'An error occurred';
}

// ===== Disposable Email Blocklist =====
var DISPOSABLE_DOMAINS = [
  'mailinator.com','guerrillamail.com','tempmail.com','10minutemail.com',
  'throwaway.email','trashmail.com','yopmail.com','sharklasers.com',
  'spam4.me','grr.la','mailnator.com','mailexpire.com','maildrop.cc',
  'mintemail.com','getnada.com','temp-mail.org','tempemail.net',
  'tempmail.net','mail.tm','guerrillamail.org','guerrillamail.net',
  'throwawaymail.com','trashmail.net','yopmail.fr','yopmail.net',
  'spambob.com','spambog.com','spamcowboy.com','spamday.com',
  'spamdecoy.net','spameater.com','spamgourmet.com','spamhereplease.com',
  'spamhole.com','spamify.com','spaminator.de','spamkill.info',
  'spaml.com','spamserver.de','spamspot.com','spamthis.co.uk',
  'spamtrail.com','spamwins.com','tempalias.com','tempmail.xyz',
  'tmpmail.net','trash2009.com','trash360.com','trashdevil.de',
  'trashmail.org','trashymail.com','wegwerfmail.de','wegwerfmail.net',
  'wegwerfmail.org','wh4f.org','whyspam.me','willselfdestruct.com',
  'xagloo.com','xemaps.com','xents.com','xmaily.com','xoxy.net',
  'yep.it','yogamaven.com','zehnminutenmail.de','zippymail.info',
  'zoaxe.com','zoemail.com','zoemail.net','zoemail.org',
  'getairmail.com','getonemail.com','mailcatch.com','maileater.com',
  'mailmetrash.com','mailzilla.com','mohmal.com','mytrashmail.com',
  'nowmymail.com','receiveee.com','sofort-mail.de','spambox.info',
  'spambox.me','tittbit.in','tmail.ws','tmpeml.com','tmpjr.me',
  'trbvm.com','trbvn.com','turual.com','tyldd.com','upliftnow.com',
  'veryrealemail.com','winemaven.info','wronghead.com','wuzup.net'
];

function isDisposableEmail(email) {
  var domain = email.split('@')[1].toLowerCase();
  return DISPOSABLE_DOMAINS.indexOf(domain) !== -1;
}

console.log('✓ EARNNOVA Firebase initialized');
