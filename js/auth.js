// =============================================
// EARNNOVA BETA - Authentication Module
// =============================================
let currentUser = null;
let currentUserData = null;

// Auth state listener
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadUserData(user.uid);
  } else {
    currentUser = null;
    currentUserData = null;
    showPage('authPage');
  }
});

async function loadUserData(uid) {
  try {
    const doc = await usersRef.doc(uid).get();
    if (doc.exists) {
      currentUserData = { id: uid, ...doc.data() };
      
      // Check admin
      if (currentUser.email === ADMIN_EMAIL) {
        currentUserData.isAdmin = true;
        await systemConfigRef.set({
          adminUids: firebase.firestore.FieldValue.arrayUnion(uid)
        }, { merge: true });
      }
      
      initApp(currentUserData);
    } else {
      if (currentUser) await createUserDoc(currentUser);
      await loadUserData(currentUser.uid);
    }
  } catch (e) {
    console.error('Load user error:', e);
    showAlert('Error loading profile', 'error');
  }
}

async function createUserDoc(user) {
  const data = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    photo: user.photoURL || '',
    phone: '',
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    adsWatched: 0,
    referralCode: generateRefCode(),
    referredBy: '',
    isActive: true,
    isAdmin: user.email === ADMIN_EMAIL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  await usersRef.doc(user.uid).set(data);
}

function generateRefCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ===== UI HELPERS =====
function showPage(id) {
  document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
  const page = document.getElementById(id);
  if (page) page.style.display = 'block';
}

function showAlert(msg, type = 'error') {
  const box = document.getElementById('alertBox');
  if (box) {
    box.textContent = msg;
    box.className = 'alert-box alert-' + type;
    setTimeout(() => box.style.display = 'none', 5000);
  }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getAuthError(error) {
  const m = {
    'auth/user-not-found': 'No account found',
    'auth/wrong-password': 'Invalid password',
    'auth/email-already-in-use': 'Email already registered',
    'auth/weak-password': 'Password too weak',
    'auth/invalid-email': 'Invalid email',
    'auth/too-many-requests': 'Too many attempts, try later',
    'auth/network-request-failed': 'Network error'
  };
  return m[error.code] || error.message || 'An error occurred';
}

// ===== EVENT LISTENERS =====

// Login
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = '⏳ Signing in...';
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    showAlert(getAuthError(err));
    btn.disabled = false; btn.textContent = 'Sign In';
  }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const ref = document.getElementById('regReferral').value.trim();
  const btn = document.getElementById('registerBtn');
  
  if (password.length < 6) { showAlert('Password needs 6+ characters'); return; }
  btn.disabled = true; btn.textContent = '⏳ Creating...';
  
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await user.updateProfile({ displayName: name });
    
    // Create user doc
    const userData = {
      uid: user.uid, email, name, photo: '', phone: '',
      balance: 0, totalEarned: 0, totalWithdrawn: 0, adsWatched: 0,
      referralCode: generateRefCode(), referredBy: '',
      isActive: true, isAdmin: email === ADMIN_EMAIL,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Process referral
    if (ref) {
      const refSnap = await usersRef.where('referralCode', '==', ref.toUpperCase()).get();
      if (!refSnap.empty) {
        const referrer = refSnap.docs[0];
        userData.referredBy = referrer.id;
        await usersRef.doc(referrer.id).update({
          balance: firebase.firestore.FieldValue.increment(5),
          totalEarned: firebase.firestore.FieldValue.increment(5)
        });
        await referralsRef.add({
          referrerId: referrer.id, referredId: user.uid,
          referredName: name, bonus: 5,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    await usersRef.doc(user.uid).set(userData);
    showToast('Account created! 🎉');
  } catch (err) {
    showAlert(getAuthError(err));
    btn.disabled = false; btn.textContent = 'Create Account';
  }
});

// Google Sign-In
document.getElementById('googleBtn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    showAlert(getAuthError(err));
  }
});

// Forgot password
document.getElementById('forgotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  const btn = document.getElementById('forgotBtn');
  btn.disabled = true; btn.textContent = '⏳ Sending...';
  try {
    await auth.sendPasswordResetEmail(email);
    showAlert('Reset link sent! Check your inbox.', 'success');
    btn.textContent = 'Send Reset Link'; btn.disabled = false;
  } catch (err) {
    showAlert(getAuthError(err));
    btn.textContent = 'Send Reset Link'; btn.disabled = false;
  }
});

// Auth toggle links
document.getElementById('toggleLink').addEventListener('click', e => {
  e.preventDefault();
  const login = document.getElementById('loginForm').style.display !== 'none';
  document.getElementById('loginForm').style.display = login ? 'none' : 'block';
  document.getElementById('registerForm').style.display = login ? 'block' : 'none';
  document.getElementById('authSubtitle').textContent = login ? 'Create Account' : 'Welcome Back';
  document.getElementById('toggleText').textContent = login ? 'Already have an account?' : "Don't have an account?";
  document.getElementById('toggleLink').textContent = login ? 'Sign In' : 'Sign Up';
});

document.getElementById('forgotLink').addEventListener('click', e => {
  e.preventDefault();
  showAuthForm('forgot');
});

document.getElementById('backToLogin').addEventListener('click', e => {
  e.preventDefault();
  showAuthForm('login');
});

function showAuthForm(form) {
  document.getElementById('loginForm').style.display = form === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = form === 'register' ? 'block' : 'none';
  document.getElementById('forgotForm').style.display = form === 'forgot' ? 'block' : 'none';
}
