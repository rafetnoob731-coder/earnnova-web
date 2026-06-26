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
      referralCode: generateRefCode(), referredBy: '',
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
  } catch(err) {
    showAlert(getAuthError(err));
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

// ===== GOOGLE SIGN-IN (popup-based — no redirect, no page reload issues) =====
// Popup keeps user on same page. Redirect causes a 2nd page load that loses auth
// state on some mobile browsers (IndexedDB persistence unavailable after redirect).
var _googleBusy = false;
var _googleProvider = null;

function googleSignIn() {
  if (_googleBusy) return;
  _googleBusy = true;
  _googleProvider = new firebase.auth.GoogleAuthProvider();
  _googleProvider.setCustomParameters({ prompt: 'select_account', login_hint: '' });
  
  // Call signInWithPopup IMMEDIATELY (synchronously within click handler)
  // DO NOT modify DOM before this call or some browsers won't allow the popup
  auth.signInWithPopup(_googleProvider).then(function() {
    _googleBusy = false;
    _googleProvider = null;
    var btn = document.getElementById('googleBtn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-google"></i> Continue with Google'; }
  }).catch(function(err) {
    _googleBusy = false;
    var btn = document.getElementById('googleBtn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-google"></i> Continue with Google'; }
    
    var msg = getAuthError(err);
    
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      // Show a fallback redirect button
      var fb = document.getElementById('googleFallbackBtn');
      if (!fb && btn && btn.parentNode) {
        fb = document.createElement('button');
        fb.id = 'googleFallbackBtn';
        fb.className = 'auth-glass-btn auth-glass-btn-outline';
        fb.style.cssText = 'margin-top:8px;font-size:13px;padding:9px;background:rgba(255,255,255,0.03);color:var(--slate-400)';
        fb.innerHTML = '↪ Open Google in new tab';
        fb.onclick = function() {
          fb.disabled = true; fb.innerHTML = '⏳ Opening...';
          auth.signInWithRedirect(_googleProvider).catch(function(e2) {
            fb.disabled = false; fb.innerHTML = '↪ Open Google in new tab';
            showAlert('Redirect: ' + (getAuthError(e2) || e2.message));
          });
        };
        btn.parentNode.insertBefore(fb, btn.nextSibling);
      }
      msg = 'Popup blocked. Tap the button below to use redirect instead.';
      showAlert(msg);
      return;
    }
    
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
