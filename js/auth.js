// =============================================
// EARNNOVA BETA - Auth Module (Mobile)
// =============================================
function showAlert(msg, type = 'error') {
  const box = document.getElementById('alertBox');
  if (box) {
    box.textContent = msg;
    box.className = 'alert-box alert-' + type;
    setTimeout(() => box.style.display = 'none', 5000);
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

// ===== GOOGLE =====
document.getElementById('googleBtn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch(err) {
    showAlert(getAuthError(err));
  }
});

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

// ===== AUTH TOGGLE =====
document.getElementById('toggleLink').addEventListener('click', e => {
  e.preventDefault();
  const login = document.getElementById('loginForm').style.display !== 'none';
  document.getElementById('loginForm').style.display = login ? 'none' : 'block';
  document.getElementById('registerForm').style.display = login ? 'block' : 'none';
  document.querySelector('.auth-tagline').textContent = login ? 'Join us and start earning' : 'Welcome back';
  document.getElementById('toggleText').textContent = login ? 'Already have an account?' : "Don't have an account?";
  document.getElementById('toggleLink').textContent = login ? 'Sign In' : 'Sign Up';
});

document.getElementById('forgotLink').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'block';
  document.querySelector('.auth-tagline').textContent = 'Reset your password';
});

document.getElementById('backToLogin').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.querySelector('.auth-tagline').textContent = 'Welcome back';
});
