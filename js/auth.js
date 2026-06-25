// =============================================
// EARNNOVA BETA - Auth Module (Mobile)
// =============================================
function showAlert(msg, type = 'error') {
  const box = document.getElementById('alertBox');
  if (box) {
    box.textContent = msg;
    box.className = 'auth-glass-alert ' + type;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 5000);
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

// ===== GOOGLE (mobile-friendly with redirect fallback) =====
function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  // Try popup first (fast), fallback to redirect if popup blocked
  auth.signInWithPopup(provider).catch(function(err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      // Use redirect instead — more reliable on mobile
      return auth.signInWithRedirect(provider);
    }
    var msg = getAuthError(err);
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'Domain not authorized. Contact support or try Email login.';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Google Sign-In not enabled in Firebase Console.';
    }
    showAlert(msg);
  });
}
document.getElementById('googleBtn').addEventListener('click', googleSignIn);

// ===== PHONE AUTH =====
let phoneConfirmationResult = null;
let phoneRecaptchaWidgetId = null;

function initPhoneAuth() {
  var phoneBtn = document.getElementById('phoneBtn');
  var phoneSection = document.getElementById('phoneAuthSection');
  var backBtn = document.getElementById('backFromPhone');
  var cancelBtn = document.getElementById('cancelPhone');
  var sendBtn = document.getElementById('sendOtpBtn');
  var verifyBtn = document.getElementById('verifyOtpBtn');
  var phoneInput = document.getElementById('phoneInput');
  var otpInput = document.getElementById('otpInput');
  
  if (!phoneBtn) return;
  
  // Show phone form
  phoneBtn.addEventListener('click', function() {
    phoneSection.classList.remove('hidden');
    document.getElementById('phoneStep1').classList.remove('hidden');
    document.getElementById('phoneStep2').classList.add('hidden');
    phoneBtn.style.display = 'none';
    document.getElementById('googleBtn').style.display = 'none';
    // Render reCAPTCHA
    setTimeout(renderPhoneRecaptcha, 300);
  });
  
  backBtn.addEventListener('click', function(e) {
    e.preventDefault();
    phoneSection.classList.add('hidden');
    phoneBtn.style.display = 'flex';
    document.getElementById('googleBtn').style.display = 'flex';
  });
  
  cancelBtn.addEventListener('click', function(e) {
    e.preventDefault();
    phoneSection.classList.add('hidden');
    phoneBtn.style.display = 'flex';
    document.getElementById('googleBtn').style.display = 'flex';
    if (phoneConfirmationResult) phoneConfirmationResult = null;
  });
  
  // Send OTP
  sendBtn.addEventListener('click', function() {
    var phone = phoneInput.value.trim();
    if (!phone) { showAlert('Enter phone number'); return; }
    if (!phone.startsWith('+')) { showAlert('Use format: +1234567890'); return; }
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Sending...';
    
    var appVerifier = new firebase.auth.RecaptchaVerifier('phoneRecaptcha', {
      size: 'invisible',
      callback: function() { /* reCAPTCHA solved */ }
    });
    
    auth.signInWithPhoneNumber(phone, appVerifier)
      .then(function(confirmationResult) {
        phoneConfirmationResult = confirmationResult;
        document.getElementById('phoneStep1').classList.add('hidden');
        document.getElementById('phoneStep2').classList.remove('hidden');
        sendBtn.disabled = false;
        sendBtn.textContent = '📱 Send OTP';
        showToast('OTP sent! 📱');
        setTimeout(function() { otpInput.focus(); }, 500);
      })
      .catch(function(err) {
        sendBtn.disabled = false;
        sendBtn.textContent = '📱 Send OTP';
        var msg = getAuthError(err);
        if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone format. Use +[country][number]';
        else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
        else if (err.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded. Try Email login.';
        showAlert(msg);
        // Reset reCAPTCHA
        if (appVerifier) appVerifier.clear();
      });
  });
  
  // Verify OTP
  verifyBtn.addEventListener('click', function() {
    var code = otpInput.value.trim();
    if (!code || code.length < 6) { showAlert('Enter the 6-digit code'); return; }
    verifyBtn.disabled = true;
    verifyBtn.textContent = '⏳ Verifying...';
    
    phoneConfirmationResult.confirm(code)
      .then(function(result) {
        showToast('Signed in! ✅');
        // Reset form
        phoneSection.classList.add('hidden');
        phoneBtn.style.display = 'flex';
        document.getElementById('googleBtn').style.display = 'flex';
        phoneInput.value = '';
        otpInput.value = '';
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✅ Verify';
      })
      .catch(function(err) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✅ Verify';
        var msg = getAuthError(err);
        if (err.code === 'auth/invalid-verification-code') msg = 'Invalid code. Try again.';
        else if (err.code === 'auth/code-expired') msg = 'Code expired. Request a new one.';
        showAlert(msg);
      });
  });
}

function renderPhoneRecaptcha() {
  var container = document.getElementById('phoneRecaptcha');
  if (!container) return;
  container.innerHTML = '';
  try {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch(e){}
    }
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('phoneRecaptcha', {
      size: 'normal',
      theme: 'dark',
      callback: function() { /* solved */ }
    });
    window.recaptchaVerifier.render().then(function(widgetId) {
      phoneRecaptchaWidgetId = widgetId;
    });
  } catch(e) {
    console.warn('reCAPTCHA render:', e.message);
    // Fallback to invisible
    container.innerHTML = '';
  }
}

// Initialize phone auth
initPhoneAuth();

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
