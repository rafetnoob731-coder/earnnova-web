// =============================================
// EARNNOVA — Main Application
// =============================================

var currentUser = null;
var currentUserData = null;
var isAdminUser = false;
var _authResolved = false;

// ===== AUTH FLOW =====
(function initAuth() {
  if (!auth) {
    console.error('Firebase Auth not available');
    setTimeout(function() { window.location.href = 'login.html'; }, 2000);
    return;
  }

  // Timeout: redirect to login if auth takes > 10s
  var authTimeout = setTimeout(function() {
    if (!_authResolved) window.location.href = 'login.html';
  }, 10000);

  auth.onAuthStateChanged(function(user) {
    _authResolved = true;
    clearTimeout(authTimeout);

    if (user) {
      currentUser = user;
      loadUserData(user.uid);
    } else {
      window.location.href = 'login.html';
    }
  });
})();

// ===== LOAD USER DATA =====
async function loadUserData(uid) {
  var loading = document.getElementById('authLoading');
  if (loading) loading.classList.add('hide');
  var splash = document.getElementById('splash');
  if (splash) splash.classList.add('hide');

  if (!db) {
    // Offline mode: use local data
    currentUserData = {
      id: uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || '',
      balance: parseFloat(localStorage.getItem('en_bal') || '0'),
      totalEarned: parseFloat(localStorage.getItem('en_earned') || '0'),
      adsWatched: parseInt(localStorage.getItem('en_watched') || '0')
    };
    initApp();
    return;
  }

  try {
    var doc = await fbTimeout(usersRef.doc(uid).get());
    if (doc.exists) {
      currentUserData = { id: uid, ...doc.data() };
    } else {
      // Create user doc
      await createUserDoc(currentUser);
      var newDoc = await fbTimeout(usersRef.doc(uid).get());
      currentUserData = { id: uid, ...(newDoc.exists ? newDoc.data() : {}) };
    }
  } catch(e) {
    console.warn('Firestore error, using local cache:', e.message);
    currentUserData = {
      id: uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || '',
      balance: parseFloat(localStorage.getItem('en_bal') || '0'),
      totalEarned: parseFloat(localStorage.getItem('en_earned') || '0'),
      adsWatched: parseInt(localStorage.getItem('en_watched') || '0')
    };
  }
  initApp();
}

async function createUserDoc(user) {
  if (!db) return;
  var name = user.displayName || user.email?.split('@')[0] || 'User';
  var refCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  var userData = {
    uid: user.uid,
    email: user.email || '',
    name: name,
    photo: '',
    phone: '',
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    adsWatched: 0,
    todayAds: 0,
    lastAdDate: '',
    referralCode: refCode,
    referredBy: '',
    isActive: true,
    isAdmin: user.email === ADMIN_EMAIL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    await fbTimeout(usersRef.doc(user.uid).set(userData));
  } catch(e) {
    console.warn('Create user doc error:', e.message);
  }
}

// ===== INIT APP =====
function initApp() {
  try {
    var appPage = document.getElementById('appPage');
    if (appPage) appPage.classList.remove('hidden');

    updateUI();
    checkAdmin();
    initNavigation();
    initAdSystem();
    initClock();
    loadTransactions();

    // Welcome notification
    if (!localStorage.getItem('en_welcomed_v2')) {
      localStorage.setItem('en_welcomed_v2', '1');
      setTimeout(function() {
        showNotification('💰 Welcome to EARNNOVA!', 'Watch ads, earn rewards, withdraw anytime.', '🎉');
      }, 1500);
    }
  } catch(e) {
    console.error('initApp error:', e.message);
    var appPage = document.getElementById('appPage');
    if (appPage) {
      appPage.classList.remove('hidden');
      appPage.innerHTML = '<div class="glass-card p-6 text-center" style="margin-top:80px"><h2>⚠️ Something went wrong</h2><p class="text-sm mt-2 opacity-50">' + e.message + '</p><button onclick="location.reload()" class="btn-primary mt-4">Reload</button></div>';
    }
  }
}

// ===== UPDATE UI =====
function updateUI() {
  var data = currentUserData || {};
  document.querySelectorAll('[data-balance]').forEach(function(el) {
    el.textContent = '$' + (data.balance || 0).toFixed(2);
  });
  document.querySelectorAll('[data-name]').forEach(function(el) {
    el.textContent = data.name || 'User';
  });
  document.querySelectorAll('[data-email]').forEach(function(el) {
    el.textContent = data.email || '';
  });
  document.querySelectorAll('[data-total-earned]').forEach(function(el) {
    el.textContent = '$' + (data.totalEarned || 0).toFixed(2);
  });
  document.querySelectorAll('[data-ads-watched]').forEach(function(el) {
    el.textContent = data.adsWatched || 0;
  });
  document.querySelectorAll('[data-ref-code]').forEach(function(el) {
    el.textContent = data.referralCode || 'N/A';
  });
}

// ===== CHECK ADMIN =====
function checkAdmin() {
  if (!currentUser || !currentUserData) return;
  isAdminUser = currentUserData.isAdmin === true || currentUser.email === ADMIN_EMAIL;
  var adminBtn = document.getElementById('adminToggleBtn');
  if (adminBtn) adminBtn.style.display = isAdminUser ? 'flex' : 'none';
}

// ===== NAVIGATION =====
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var page = this.dataset.page;
      navigate(page);
    });
  });
}

function navigate(page) {
  document.querySelectorAll('.page-view').forEach(function(p) { p.classList.add('hidden'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  
  var target = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (target) target.classList.remove('hidden');
  
  var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');
}

// ===== CLOCK =====
function initClock() {
  function update() {
    var el = document.getElementById('statusTime');
    if (el) {
      var d = new Date();
      el.textContent = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }
  }
  update();
  setInterval(update, 10000);
}

// ===== NOTIFICATIONS =====
function showNotification(title, message, icon) {
  var container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = 'position:fixed;top:60px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:320px';
    document.body.appendChild(container);
  }
  
  var notif = document.createElement('div');
  notif.style.cssText = 'background:rgba(16,24,40,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;transform:translateX(120%);transition:transform 0.4s cubic-bezier(0.23,1,0.32,1);box-shadow:0 8px 40px rgba(0,0,0,0.3)';
  notif.innerHTML = '<span style="font-size:24px">' + (icon || '📢') + '</span><div><div style="font-size:13px;font-weight:600">' + title + '</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">' + message + '</div></div>';
  container.appendChild(notif);
  
  requestAnimationFrame(function() { notif.style.transform = 'translateX(0)'; });
  
  setTimeout(function() {
    notif.style.transform = 'translateX(120%)';
    setTimeout(function() { notif.remove(); }, 400);
  }, 4000);
}

// ===== TRANSACTIONS =====
async function loadTransactions() {
  var container = document.getElementById('transactionsList');
  if (!container || !db) return;
  
  try {
    var snapshot = await fbTimeout(
      transactionsRef.where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
    );
    
    container.innerHTML = '';
    if (snapshot.empty) {
      container.innerHTML = '<div class="text-center py-8 opacity-40" style="font-size:14px">No transactions yet</div>';
      return;
    }
    
    snapshot.forEach(function(doc) {
      var data = doc.data();
      var isPositive = data.amount > 0;
      var date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      container.innerHTML +=
        '<div class="tx-item">' +
          '<div class="tx-icon">' + (isPositive ? '📈' : '📤') + '</div>' +
          '<div class="tx-info"><div class="tx-desc">' + (data.description || data.type || 'Transaction') + '</div><div class="tx-date">' + date.toLocaleDateString() + '</div></div>' +
          '<div class="tx-amount ' + (isPositive ? 'tx-pos' : 'tx-neg') + '">' + (isPositive ? '+' : '') + '$' + Math.abs(data.amount).toFixed(2) + '</div>' +
        '</div>';
    });
  } catch(e) {
    console.warn('Load transactions error:', e.message);
  }
}

// ===== AD SYSTEM =====
var adCooldown = false;
var dailyAdCount = 0;
var MAX_DAILY_ADS = 30;
var AD_REWARD = 0.02;

function initAdSystem() {
  resetDailyAds();
  updateAdUI();
}

function resetDailyAds() {
  var today = new Date().toDateString();
  var stored = localStorage.getItem('en_ad_date');
  if (stored !== today) {
    localStorage.setItem('en_ad_date', today);
    localStorage.setItem('en_ad_count', '0');
    dailyAdCount = 0;
  } else {
    dailyAdCount = parseInt(localStorage.getItem('en_ad_count') || '0');
  }
}

function updateAdUI() {
  document.querySelectorAll('[data-ad-count]').forEach(function(el) {
    el.textContent = dailyAdCount + '/' + MAX_DAILY_ADS;
  });
  var progress = document.getElementById('adProgress');
  if (progress) {
    var pct = Math.min(100, (dailyAdCount / MAX_DAILY_ADS) * 100);
    progress.style.width = pct + '%';
  }
}

async function watchAd() {
  if (adCooldown) { showNotification('⏳ Cooldown', 'Please wait before watching another ad', '⏳'); return; }
  if (dailyAdCount >= MAX_DAILY_ADS) { showNotification('⚠️ Daily Limit', 'You\'ve reached the daily ad limit', '⚠️'); return; }
  
  // Show ad modal
  var modal = document.getElementById('adModal');
  if (!modal) return;
  modal.classList.add('show');
  
  var timer = document.getElementById('adTimer');
  var progress = document.getElementById('adProgressBar');
  var countdown = 30;
  
  modal.innerHTML =
    '<div class="ad-modal-content">' +
      '<div class="ad-modal-header">📺 Watch Ad</div>' +
      '<div class="ad-timer-circle" id="adTimerCircle">' +
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="ad-timer-bg"/><circle cx="50" cy="50" r="42" class="ad-timer-progress" id="adTimerProgress"/></svg>' +
        '<div class="ad-timer-text" id="adTimerText">30</div>' +
      '</div>' +
      '<div class="ad-reward">+$' + AD_REWARD.toFixed(2) + '</div>' +
      '<div class="ad-status" id="adStatus">Watching...</div>' +
    '</div>';
  
  adCooldown = true;
  var timerProgress = document.getElementById('adTimerProgress');
  var timerText = document.getElementById('adTimerText');
  var adStatus = document.getElementById('adStatus');
  
  var interval = setInterval(function() {
    countdown--;
    if (timerText) timerText.textContent = countdown;
    if (timerProgress) {
      var circumference = 2 * Math.PI * 42;
      timerProgress.style.strokeDasharray = circumference;
      timerProgress.style.strokeDashoffset = circumference * (1 - countdown / 30);
    }
    if (countdown <= 0) {
      clearInterval(interval);
      completeAd();
    }
  }, 1000);
}

async function completeAd() {
  dailyAdCount++;
  localStorage.setItem('en_ad_count', String(dailyAdCount));
  
  var earnings = AD_REWARD;
  
  // Update local balance
  var bal = parseFloat(localStorage.getItem('en_bal') || '0');
  bal += earnings;
  localStorage.setItem('en_bal', String(bal));
  
  var earned = parseFloat(localStorage.getItem('en_earned') || '0');
  earned += earnings;
  localStorage.setItem('en_earned', String(earned));
  
  var watched = parseInt(localStorage.getItem('en_watched') || '0');
  watched++;
  localStorage.setItem('en_watched', String(watched));
  
  // Update Firestore
  if (db && currentUser) {
    try {
      await usersRef.doc(currentUser.uid).update({
        balance: firebase.firestore.FieldValue.increment(earnings),
        totalEarned: firebase.firestore.FieldValue.increment(earnings),
        adsWatched: firebase.firestore.FieldValue.increment(1),
        todayAds: firebase.firestore.FieldValue.increment(1),
        lastAdDate: new Date().toDateString()
      });
      
      await transactionsRef.add({
        userId: currentUser.uid,
        type: 'ad_reward',
        amount: earnings,
        status: 'completed',
        description: 'Ad reward #' + watched,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {
      console.warn('Firestore update error:', e.message);
    }
  }
  
  // Update UI
  var timerText = document.getElementById('adTimerText');
  var adStatus = document.getElementById('adStatus');
  if (timerText) timerText.textContent = '✓';
  if (adStatus) {
    adStatus.textContent = '+$' + earnings.toFixed(2) + ' Earned!';
    adStatus.style.color = '#10B981';
  }
  
  showNotification('💰 +$' + earnings.toFixed(2), 'Ad reward added to your balance', '💰');
  
  setTimeout(function() {
    var modal = document.getElementById('adModal');
    if (modal) modal.classList.remove('show');
    adCooldown = false;
    updateAdUI();
    updateUI();
    loadTransactions();
  }, 1500);
}

// ===== AD COOLDOWN CHECK =====
setInterval(function() {
  if (adCooldown) {
    var status = document.getElementById('adStatus');
    if (status && status.textContent !== 'Watching...') {
      // Already processed
    }
  }
}, 500);

// ===== WITHDRAWAL =====
async function requestWithdrawal() {
  if (!db || !currentUser) {
    showNotification('⚠️ Offline', 'Withdrawals require an internet connection', '⚠️');
    return;
  }
  
  var method = document.getElementById('wdMethod')?.value;
  var amount = parseFloat(document.getElementById('wdAmount')?.value);
  
  if (!method) { showNotification('⚠️ Error', 'Please select a withdrawal method', '⚠️'); return; }
  if (!amount || amount < 5) { showNotification('⚠️ Error', 'Minimum withdrawal: $5.00', '⚠️'); return; }
  
  var bal = currentUserData?.balance || parseFloat(localStorage.getItem('en_bal') || '0');
  if (amount > bal) { showNotification('⚠️ Error', 'Insufficient balance', '⚠️'); return; }
  
  try {
    var accountDetails = {};
    document.querySelectorAll('[data-wd-field]').forEach(function(el) {
      accountDetails[el.dataset.wdField] = el.value;
    });
    
    await fbTimeout(withdrawalsRef.add({
      userId: currentUser.uid,
      method: method,
      amount: amount,
      fee: amount * 0.05,
      accountDetails: accountDetails,
      status: 'pending',
      adminNote: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    
    await fbTimeout(usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount)
    }));
    
    await fbTimeout(transactionsRef.add({
      userId: currentUser.uid,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: 'Withdrawal via ' + method,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    
    showNotification('✅ Withdrawal Requested', '$' + amount.toFixed(2) + ' via ' + method, '✅');
    
    // Clear form
    document.getElementById('wdAmount').value = '';
    updateUI();
    loadTransactions();
  } catch(e) {
    showNotification('❌ Error', e.message || 'Withdrawal failed', '❌');
  }
}

// ===== REFERRAL =====
function copyReferral() {
  var code = currentUserData?.referralCode || 'N/A';
  var text = 'Join EARNNOVA and start earning! Use my referral code: ' + code + '\nhttps://earnnova-web.vercel.app/register.html';
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showNotification('📋 Copied!', 'Referral link copied to clipboard', '📋');
    });
  } else {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showNotification('📋 Copied!', 'Referral link copied to clipboard', '📋');
  }
}
