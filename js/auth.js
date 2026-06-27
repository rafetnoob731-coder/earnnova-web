// =============================================
// EARNNOVA BETA - Auth Module (Mobile)
// =============================================
function showAlert(msg, type) {
  if (!type) type = 'error';
  var box = document.getElementById('alertBox');
  if (box) {
    box.textContent = msg;
    box.className = 'auth-glass-alert ' + type;
    box.style.display = 'block';
    // Shake + glow animation on errors
    if (type === 'error') {
      box.classList.add('shake-error');
      setTimeout(function() { box.classList.remove('shake-error'); }, 600);
    }
    setTimeout(function() { box.style.display = 'none'; }, 5000);
  }
}

function getAuthError(error) {
  const m = {
    'auth/user-not-found': 'No account with this email',
    'auth/wrong-password': 'Invalid password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be 6+ characters',
    'auth/invalid-email': 'Please enter a valid email',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/popup-closed-by-user': 'Sign-in cancelled'
  };
  return m[error.code] || error.message || 'An error occurred';
}

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Signing in...';
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch(err) {
    showAlert(getAuthError(err));
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

// ===== REGISTER =====
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const ref = document.getElementById('regReferral').value.trim();
  const btn = document.getElementById('registerBtn');
  
  if (password.length < 6) { showAlert('Password must be 6+ characters'); return; }
  btn.disabled = true;
  btn.textContent = '⏳ Creating...';
  
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await user.updateProfile({ displayName: name });
    
    const userData = {
      uid: user.uid, email, name, photo: '', phone: '',
      balance: 0, totalEarned: 0, totalWithdrawn: 0,
      adsWatched: 0, todayAds: 0, lastAdDate: '',
      referralCode: Math.random().toString(36).substring(2,10).toUpperCase(), referredBy: '',
      streak: 0, lastActive: '',
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
          balance: firebase.firestore.FieldValue.increment(0.50),
          totalEarned: firebase.firestore.FieldValue.increment(0.50)
        });
        await referralsRef.add({
          referrerId: referrer.id, referredId: user.uid,
          referredName: name, bonus: 0.50,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    await usersRef.doc(user.uid).set(userData);
    showAlert('Account created! 🎉 Redirecting...', 'success');
  } catch(err) {
    showAlert(getAuthError(err));
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

// ===== GOOGLE SIGN-IN (redirect-based — most reliable on mobile & cross-browser) =====
// Per Firebase best practices: use signInWithRedirect() consistently.
// After redirect, the page reloads and getRedirectResult() (in app.js) handles the result.
function googleSignIn() {
  var btn = document.getElementById('googleBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Redirecting...'; }
  
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  auth.signInWithRedirect(provider).catch(function(err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-google"></i> Continue with Google'; }
    var msg = getAuthError(err);
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'Domain not authorized. Add ' + window.location.hostname + ' to Firebase Console.';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Google Sign-In not enabled in Firebase Console.';
    }
    showAlert(msg);
  });
}
document.getElementById('googleBtn').addEventListener('click', googleSignIn);

// ===== FORGOT PASSWORD =====
document.getElementById('forgotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  const btn = document.getElementById('forgotBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';
  try {
    await auth.sendPasswordResetEmail(email);
    showAlert('Reset link sent! Check your inbox.', 'success');
  } catch(err) {
    showAlert(getAuthError(err));
  }
  btn.textContent = 'Send Reset Link';
  btn.disabled = false;
});

// ===== AUTH FORM TOGGLE =====
function showAuthForm(form) {
  const lf = document.getElementById('loginForm');
  const rf = document.getElementById('registerForm');
  const ff = document.getElementById('forgotForm');
  lf.classList.toggle('hidden', form !== 'login');
  rf.classList.toggle('hidden', form !== 'register');
  ff.classList.toggle('hidden', form !== 'forgot');
  const tagline = document.querySelector('.auth-tagline');
  if (form === 'login') tagline.textContent = 'Welcome back';
  else if (form === 'register') tagline.textContent = 'Join us and start earning';
  else tagline.textContent = 'Reset your password';
}

document.getElementById('toggleLink').addEventListener('click', e => {
  e.preventDefault();
  const login = !document.getElementById('loginForm').classList.contains('hidden');
  showAuthForm(login ? 'register' : 'login');
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
