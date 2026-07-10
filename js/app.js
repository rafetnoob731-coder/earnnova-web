// =============================================
// EARNNOVA — Main Application v3.0
// Professional Earning Platform
// =============================================

var currentUser = null;
var currentUserData = null;
var isAdminUser = false;
var _authResolved = false;
var _balanceInterval = null;

// ===== UTILITY FUNCTIONS =====
function $(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function formatCurrency(n) {
  return '$' + (n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '';
  if (d.toDate) d = d.toDate();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

// ===== AUTH INIT =====
(function initAuth() {
  if (!auth) {
    showToast('⚠️', 'Connection Error', 'Firebase not available. Check your connection.', 'error');
    setTimeout(function() { window.location.href = 'login.html'; }, 2500);
    return;
  }

  var authTimeout = setTimeout(function() {
    if (!_authResolved) {
      showToast('⏳', 'Taking too long', 'Redirecting to login...', 'warning');
      setTimeout(function() { window.location.href = 'login.html'; }, 1000);
    }
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
  hideSplash();
  if (!db) { loadOffline(uid); return; }

  try {
    var doc = await fbTimeout(usersRef.doc(uid).get());
    if (doc.exists) {
      currentUserData = { id: uid, ...doc.data() };
      // Check if user is banned (skip for owner)
      if (currentUserData.isActive === false && currentUser.email !== ADMIN_EMAIL) {
        showToast('🚫', 'Account Banned', 'Your account has been banned. Contact support.', 'error');
        setTimeout(function() { auth.signOut(); localStorage.clear(); window.location.href = 'login.html'; }, 2000);
        return;
      }
      // Auto-unban owner if somehow banned
      if (currentUser.email === ADMIN_EMAIL && currentUserData.isActive === false) {
        usersRef.doc(uid).update({ isActive: true });
        currentUserData.isActive = true;
        console.log('[OWNER] Auto-unban triggered');
      }
      localStorage.setItem('en_bal', String(currentUserData.balance || 0));
      localStorage.setItem('en_earned', String(currentUserData.totalEarned || 0));
      localStorage.setItem('en_watched', String(currentUserData.adsWatched || 0));
    } else {
      await createUserDoc(currentUser);
      var newDoc = await fbTimeout(usersRef.doc(uid).get());
      currentUserData = { id: uid, ...(newDoc.exists ? newDoc.data() : {}) };
    }
  } catch(e) {
    console.warn('Firestore error:', e.message);
    loadOffline(uid);
  }
  initApp();
}

function loadOffline(uid) {
  currentUserData = {
    id: uid, name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
    email: currentUser.email || '',
    balance: parseFloat(localStorage.getItem('en_bal') || '0'),
    totalEarned: parseFloat(localStorage.getItem('en_earned') || '0'),
    adsWatched: parseInt(localStorage.getItem('en_watched') || '0')
  };
  initApp();
}

function hideSplash() {
  var s = $('splash');
  if (s) { s.classList.add('hide'); setTimeout(function() { s.style.display = 'none'; }, 500); }
  var l = $('authLoading');
  if (l) l.classList.add('hide');
}

async function createUserDoc(user) {
  if (!db) return;
  var name = user.displayName || user.email?.split('@')[0] || 'User';
  var refCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  try {
    await fbTimeout(usersRef.doc(user.uid).set({
      uid: user.uid, email: user.email || '', name: name, photo: '', phone: '',
      balance: 0, totalEarned: 0, totalWithdrawn: 0, adsWatched: 0,
      todayAds: 0, lastAdDate: '', isActive: true, isAdmin: user.email === ADMIN_EMAIL,
      referralCode: refCode, referredBy: '', referralCount: 0, referralEarnings: 0,
      referralBonusPaid: false, regIp: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }));
  } catch(e) { console.warn('Create doc error:', e.message); }
}

// ===== INIT APP =====

// ===== AD TOKEN SYSTEM =====
function generateAdToken(type) {
  var uid = currentUser ? currentUser.uid : 'guest';
  var ts = Date.now().toString(36);
  var rnd = Math.random().toString(36).substr(2, 6);
  return uid.slice(-8) + '-' + ts + '-' + rnd + '-' + type;
}

function openAdPage(type) {
  var token = generateAdToken(type);
  window.location.href = 'ads/' + type + '.html?token=' + token + '&uid=' + (currentUser ? currentUser.uid : '');
}

// Add "ADS={token}" URL param support
(function() {
  var params = new URLSearchParams(window.location.search);
  var adsParam = params.get('ADS');
  if (adsParam) {
    // Parse ADS token and redirect to appropriate ad
    var parts = adsParam.split('-');
    var adType = parts.length > 0 ? parts[0] : 'ads2';
    if (adType.startsWith('ads') || parseInt(adType) >= 1) {
      var adName = adType.startsWith('ads') ? adType : 'ads' + adType;
      var token = generateAdToken(adName);
      setTimeout(function() { window.location.href = 'ads/' + adName + '.html?token=' + token + '&uid=' + (currentUser ? currentUser.uid : ''); }, 500);
    }
  }
})();

function initApp() {
  try {
    $('appPage')?.classList.remove('hidden');
    updateUI();
    animateBalance();
    checkAdmin();
    initNav();
    initAdSystem();
    initClock();
    initThemeToggle();
    loadTransactions();
    loadWithdrawals();

    // Welcome
    if (!localStorage.getItem('en_welcomed_v3')) {
      localStorage.setItem('en_welcomed_v3', '1');
      setTimeout(function() {
        showToast('🎉', 'Welcome to EARNNOVA!', 'Start watching ads to earn rewards.', 'success');
      }, 2000);
    }
  } catch(e) {
    console.error('initApp:', e.message);
    $('appPage')?.classList.remove('hidden');
    showToast('⚠️', 'Something went wrong', e.message, 'error');
  }
}

// ===== UPDATE UI =====
function updateUI() {
  var d = currentUserData || {};
  var bal = d.balance || 0;
  
  qsa('[data-balance]').forEach(function(el) { el.textContent = formatCurrency(bal); });
  qsa('[data-name]').forEach(function(el) { el.textContent = d.name || 'User'; });
  qsa('[data-email]').forEach(function(el) { el.textContent = d.email || ''; });
  qsa('[data-earned]').forEach(function(el) { el.textContent = formatCurrency(d.totalEarned || 0); });
  qsa('[data-watched]').forEach(function(el) { el.textContent = d.adsWatched || 0; });
  qsa('[data-ref]').forEach(function(el) { el.textContent = d.referralCode || 'N/A'; });
  var uidEl = document.getElementById('profileUserID');
  if (uidEl) uidEl.textContent = currentUser?.uid || 'N/A';
  qsa('[data-referrals]').forEach(function(el) { el.textContent = d.referralCount || 0; });
  qsa('[data-refearned]').forEach(function(el) { el.textContent = formatCurrency(d.referralEarnings || 0); });
  qsa('[data-balance-num]').forEach(function(el) { el.textContent = bal.toFixed(2); });
  
  // Avatar
  var avatar = $('profileAvatar');
  if (avatar) avatar.textContent = (d.name || 'U').charAt(0).toUpperCase();
  
  // Today earnings
  var todayEarned = parseFloat(localStorage.getItem('en_today') || '0');
  var te = $('todayEarnings');
  if (te) te.textContent = formatCurrency(todayEarned);
  
  // Nav active state for badges
  var adCount = dailyAdCount || 0;
  qsa('[data-ad-count]').forEach(function(el) { el.textContent = adCount + '/' + MAX_DAILY_ADS; });
}

// ===== ANIMATE BALANCE =====
function animateBalance() {
  var el = $('balanceDisplay');
  if (!el) return;
  
  var target = currentUserData?.balance || 0;
  var current = 0;
  var duration = 1500;
  var steps = 60;
  var increment = target / steps;
  var stepTime = duration / steps;
  var count = 0;
  
  if (_balanceInterval) clearInterval(_balanceInterval);
  
  _balanceInterval = setInterval(function() {
    count++;
    current = Math.min(current + increment, target);
    el.textContent = formatCurrency(current);
    if (count >= steps) {
      clearInterval(_balanceInterval);
      el.textContent = formatCurrency(target);
    }
  }, stepTime);
}

// ===== TOAST NOTIFICATION =====
function showToast(icon, title, message, type) {
  var container = $('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = '<div class="toast-icon">' + (icon || '📢') + '</div><div class="toast-body"><div class="toast-title">' + title + '</div><div class="toast-msg">' + (message || '') + '</div></div>';
  container.appendChild(toast);
  
  requestAnimationFrame(function() { toast.classList.add('show'); });
  
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, 4000);
}

// ===== CONFETTI =====
function showConfetti() {
  var colors = ['#D4AF37', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];
  for (var i = 0; i < 30; i++) {
    var piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (Math.random() * 100) + '%';
    piece.style.top = (40 + Math.random() * 40) + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (4 + Math.random() * 6) + 'px';
    piece.style.height = (4 + Math.random() * 6) + 'px';
    piece.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
    piece.style.animationDelay = (Math.random() * 0.3) + 's';
    document.body.appendChild(piece);
    setTimeout(function() { piece.remove(); }, 2000);
  }
}

// ===== CLOCK =====
function initClock() {
  function update() {
    var el = $('statusTime');
    if (el) { var d = new Date(); el.textContent = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }
  }
  update();
  setInterval(update, 10000);
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
  var toggle = $('themeToggle');
  if (!toggle) return;
  
  var theme = localStorage.getItem('en_theme') || 'dark';
  if (theme === 'light') document.body.classList.add('light-mode');
  
  toggle.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    var isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('en_theme', isLight ? 'light' : 'dark');
  });
}

// ===== CHECK ADMIN =====
function checkAdmin() {
  if (!currentUser || !currentUserData) return;
  isAdminUser = currentUserData.isAdmin === true || currentUser.email === ADMIN_EMAIL;
  var btn = $('adminToggleBtn');
  if (btn) btn.style.display = isAdminUser ? 'flex' : 'none';
}

// ===== NAVIGATION =====
function initNav() {
  qsa('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var page = this.dataset.page;
      navigate(page);
    });
  });
}

function navigate(page) {
  qsa('.page-view').forEach(function(p) { p.classList.remove('active'); p.style.display = 'none'; });
  qsa('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  
  var target = $('page' + page.charAt(0).toUpperCase() + page.slice(1));
  if (target) {
    target.style.display = 'block';
    setTimeout(function() { target.classList.add('active'); }, 10);
  }
  
  var navItem = qs('.nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');
  
  // Load page-specific data
  if (page === 'withdraw') loadWithdrawals();
  if (page === 'home') loadTransactions();
}

// ===== TRANSACTIONS =====
async function loadTransactions() {
  var container = $('transactionsList');
  if (!container) return;
  
  // Show skeleton
  container.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
  
  if (!db || !currentUser) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No transactions yet</div><div class="empty-desc">Start watching ads to see your activity</div></div>';
    return;
  }
  
  try {
    var snap = await fbTimeout(
      transactionsRef.where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc').limit(20).get()
    );
    
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No transactions yet</div><div class="empty-desc">Your earnings and withdrawals will appear here</div></div>';
      return;
    }
    
    snap.forEach(function(doc) {
      var d = doc.data();
      var isPos = d.amount > 0;
      var date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
      
      var icons = { 'ad_reward': '📺', 'referral_bonus': '👥', 'withdrawal': '💳', 'deposit': '💰', 'admin_credit': '🛡️' };
      var icon = icons[d.type] || (isPos ? '📈' : '📤');
      
      container.innerHTML +=
        '<div class="tx-item">' +
          '<div class="tx-icon">' + icon + '</div>' +
          '<div class="tx-info"><div class="tx-desc">' + (d.description || d.type || 'Transaction') + '</div><div class="tx-date">' + formatDate(date) + '</div></div>' +
          '<div class="tx-amount ' + (isPos ? 'tx-pos' : 'tx-neg') + '">' + (isPos ? '+' : '') + formatCurrency(Math.abs(d.amount)) + '</div>' +
        '</div>';
    });
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-desc">Could not load transactions</div></div>';
  }
}

// ===== AD SYSTEM =====
var adCooldown = false;
var dailyAdCount = 0;
var AdTypes = ['ads2','ads3','ads5','ads6','ads7','ads8','ads10'];
var currentAdType = 'ads1';
var adProgress = 0;
var adInterval = null;
var adCompleted = false;
var _rewarding = false;
var _tapCount = 0;
var _tapTarget = 0;
var _adStep = 0;
var _ballCount = 0;
var _gameScore = 0;
var _bannerTapped = false;
var _banner1Done = false;
var _banner2Done = false;
var _comboBannerDone = false;
var _comboBallsDone = false;
var _comboTapDone = false;
var _comboGameDone = false;
var _comboBannerTimer = null;
var _tapStartTime = 0;
var _tapTimes = [];
var AD_TASK_DURATION = 60;
var AD_INCREMENT = 0.010;
var MAX_DAILY_ADS = 100;
var AD_COOLDOWN_MS = 1800000; // 30 minutes
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
    localStorage.setItem('en_today', '0');
    dailyAdCount = 0;
  } else {
    dailyAdCount = parseInt(localStorage.getItem('en_ad_count') || '0');
  }
  updateAdUI();
}

function updateAdUI() {
  qsa('[data-ad-count]').forEach(function(el) { el.textContent = dailyAdCount + '/' + MAX_DAILY_ADS; });
  var progress = $('adProgress');
  if (progress) progress.style.width = Math.min(100, (dailyAdCount / MAX_DAILY_ADS) * 100) + '%';
  var countdownEl = $('adCountdown');
  if (countdownEl) countdownEl.textContent = (MAX_DAILY_ADS - dailyAdCount) + ' remaining';
}

async function watchAd() {
  if (typeof EN_adblockDetected !== 'undefined' && EN_adblockDetected) {
    showToast('🚫','Ad Blocker Active!','Please disable your ad blocker to watch ads.','error');
    return;
  }
  if (adCooldown) { showToast('\u23f3', 'Cooldown Active', 'Please wait 30 minutes between ads.', 'warning'); return; }
  if (!(currentUserData && (currentUserData.isAdmin || currentUser?.email === ADMIN_EMAIL)) && dailyAdCount >= MAX_DAILY_ADS) {
    showToast('\u26a0\ufe0f', 'Daily Limit Reached', 'You\'ve watched ' + MAX_DAILY_ADS + ' ads today. Come back tomorrow!', 'warning'); return;
  }
  
  currentAdType = AdTypes[Math.floor(Math.random() * AdTypes.length)];
  adProgress = 0;
  adCompleted = false;
  _tapCount = 0;
  _tapTarget = 0;
  _adStep = 0;
  _ballCount = 0;
  _gameScore = 0;
  _bannerTapped = false;
  _banner1Done = false;
  _banner2Done = false;
  _comboBannerDone = false;
  _comboBallsDone = false;
  _comboTapDone = false;
  _comboGameDone = false;
  _comboBannerTimer = null;
  _tapTimes = [];
  
  showAdUI();
}

function showAdUI() {
  var modal = $('adModal');
  if (!modal) return;
  var config = getAdConfig(currentAdType);
  var adContent = getAdContent(currentAdType);
  var html =
    '<div class="ad-fullscreen">' +
      '<div class="ad-topbar">' +
        '<div class="ad-topbar-left">' +
          '<span class="ad-type-badge">' + currentAdType.toUpperCase() + '</span>' +
          '<span style="font-size:10px;color:var(--text-muted);margin-left:4px">' + config.label + '</span>' +
        '</div>' +
        '<button class="ad-close-btn" id="adCloseBtn" onclick="handleAdClose()">\u2716</button>' +
      '</div>' +
      '<div class="ad-content-area" id="adContentArea">' + adContent + '</div>' +
      '<div class="ad-bottom-bar">' +
        '<div class="ad-progress-container">' +
          '<div class="ad-progress-bar" id="adProgressBar"></div>' +
        '</div>' +
        '<div class="ad-progress-text">' +
          '<span id="adTimerDisplay">' + config.timerStart + '</span>' +
          '<span id="adProgressPercent">0%</span>' +
        '</div>' +
        '<div class="ad-earnings-inline" id="adEarningsInline">+$' + config.reward.toFixed(3) + '</div>' +
      '</div>' +
    '</div>';
  modal.innerHTML = html;
  // Execute any <script> tags in the ad content (innerHTML doesn't execute them)
  modal.querySelectorAll('script').forEach(function(oldScript) {
    var newScript = document.createElement('script');
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
  modal.classList.add('show');
  adCooldown = true;
  startAdTask(currentAdType);
}

function getAdConfig(type) {
  var c = {
    ads1:  { label: 'Monetag ad',     timerStart: '0:30', duration: 30,  reward: 0.020 },
    ads2:  { label: 'SMART AD',       timerStart: '0:00', duration: 5,   reward: 0.100 },
    ads3:  { label: 'QUIZ',           timerStart: '0:00', duration: 30,  reward: 0.030 },
    ads4:  { label: 'Monetag x2',     timerStart: '0:00', duration: 5,   reward: 0.035 },
    ads5:  { label: 'CATCH COINS',    timerStart: '0:00', duration: 20,  reward: 0.040 },
    ads6:  { label: 'SPIN WHEEL',     timerStart: '0:00', duration: 10,  reward: 0.050 },
    ads7:  { label: 'MEMORY GAME',    timerStart: '0:00', duration: 40,  reward: 0.060 },
    ads8:  { label: 'TRIVIA',         timerStart: '0:00', duration: 30,  reward: 0.070 },
    ads9:  { label: 'Monetag x3',     timerStart: '0:00', duration: 8,   reward: 0.080 },
    ads10: { label: 'MEGA QUIZ',      timerStart: '0:00', duration: 60,  reward: 0.100 }
  };
  return c[type] || c.ads1;
}

function getAdContent(type) {
  switch(type) {
    case 'ads1':
      return '<div class="ad-inner"><div class="ad-placeholder" style="width:100%;height:180px;border-radius:16px;background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(16,185,129,0.1));border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:12px"><div style="font-size:48px;margin-bottom:8px">\ud83d\udcfa</div><div style="font-size:13px;color:var(--gold);font-weight:600">Monetag Rewarded</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Loading ad...</div></div><div class="ad-label">Watch the monetag ad to earn</div><div class="ad-reward-info"><span class="ad-earn-badge">+$0.020</span></div></div>';
    case 'ads2':
      return '<div class="ad-inner"><div class="smart-ad-wrap" style="width:100%;border-radius:16px;background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(16,185,129,0.08));border:1px solid rgba(212,175,55,0.2);overflow:hidden;margin-bottom:12px">' +
        '<div style="padding:12px;text-align:center;background:rgba(212,175,55,0.05)">' +
          '<div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83e\udde0 SMART AD</div>' +
          '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">AdSense + Smartlink • Click to earn $0.100</div>' +
        '</div>' +
        // AdSense visible banner
        '<div style="width:100%;min-height:100px;display:flex;justify-content:center;padding:6px 0;background:rgba(0,0,0,0.08)">' +
          '<ins class="adsbygoogle" style="display:inline-block;width:320px;height:100px" data-ad-client="ca-pub-9307459733796967" data-ad-slot="3746278661"></ins>' +
        '</div>' +
        '<script>try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}</script>' +
        '<div id="smartAdContainer" style="width:100%;min-height:120px;display:flex;align-items:center;justify-content:center;padding:8px 0;box-sizing:border-box">' +
          '<div style="text-align:center">' +
            '<div id="smartAdStatus" style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">\ud83d\udc42 Click to earn!</div>' +
            '<button id="smartAdClickBtn" onclick="handleSmartAdClick()" style="padding:14px 40px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 20px rgba(212,175,55,0.3);transition:all 0.2s">\ud83d\udcb0 Click to Earn</button>' +
            '<div id="smartAdResult" style="margin-top:12px;font-size:11px;color:var(--text-muted);display:none">\u2705 Ad visited! Reward will be credited soon...</div>' +
          '</div>' +
        '</div>' +
        // EffectiveCPM smartlink iframe
        '<iframe src="https://www.effectivecpmnetwork.com/zjzbzfk7?key=5be534a9c13e9ed7a663c6cc527b5b74" style="width:100%;height:60px;border:none;overflow:hidden;display:block" scrolling="no" frameborder="0" allowtransparency="true"></iframe>' +
        '<div style="padding:8px 12px;border-top:1px solid rgba(255,255,255,0.04);font-size:9px;color:var(--text-muted);text-align:center">Google AdSense • EffectiveCPM • Sponsored</div>' +
      '</div>' +
      '<div class="ad-reward-info"><span class="ad-earn-badge" style="background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A">\ud83e\udde0 SMART AD +$0.100</span></div></div>';
    case 'ads3':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83e\uddea QUIZ TIME!</div><div style="font-size:10px;color:var(--text-secondary)">Answer 5 questions correctly to earn $0.030</div></div>' +
        '<div id="quizArea" style="width:100%;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.1);padding:12px;box-sizing:border-box;margin-bottom:8px;min-height:200px">' +
          '<div id="quizQuestion" style="font-size:13px;font-weight:600;margin-bottom:12px">Loading question...</div>' +
          '<div id="quizOptions" style="display:flex;flex-direction:column;gap:6px"></div>' +
          '<div id="quizFeedback" style="font-size:12px;margin-top:8px;text-align:center"></div>' +
          '<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:8px"><span id="quizProgress">Question 1/5</span></div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge">+$0.030</span></div></div>';
    case 'ads5':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83e\udeb0 CATCH COINS!</div><div style="font-size:10px;color:var(--text-secondary)">Catch 10 falling coins to earn $0.040</div></div>' +
        '<div id="coinGameArea" style="width:100%;height:220px;border-radius:12px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.1);position:relative;overflow:hidden;margin-bottom:8px;cursor:pointer">' +
          '<div id="coinCatcher" style="width:50px;height:16px;border-radius:8px;background:var(--gold);position:absolute;bottom:8px;left:50%;transform:translateX(-50%);transition:left 0.1s"></div>' +
          '<div id="coinScore" style="position:absolute;top:4px;right:6px;font-size:11px;font-weight:700;color:var(--gold)">0/10 \ud83e\udeb0</div>' +
          '<div id="coinTimer" style="position:absolute;top:4px;left:6px;font-size:10px;color:var(--text-muted)">20s</div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge">+$0.040</span></div></div>';
    case 'ads6':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83c\udfaf SPIN THE WHEEL!</div><div style="font-size:10px;color:var(--text-secondary)">Spin and win up to $0.050!</div></div>' +
        '<div id="wheelArea" style="width:100%;display:flex;flex-direction:column;align-items:center;padding:12px 0;margin-bottom:8px">' +
          '<div id="wheelContainer" style="width:160px;height:160px;border-radius:50%;position:relative;background:conic-gradient(#ef4444 0deg 60deg,#f59e0b 60deg 120deg,#10b981 120deg 180deg,#3b82f6 180deg 240deg,#8b5cf6 240deg 300deg,#ec4899 300deg 360deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.3);transition:transform 3s cubic-bezier(0.17,0.67,0.12,0.99);margin-bottom:12px">' +
            '<div style="width:30px;height:30px;border-radius:50%;background:#0A0E1A;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--gold);z-index:2">\ud83c\udfaf</div>' +
            '<div style="position:absolute;top:-6px;left:50%;margin-left:-6px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid var(--gold);z-index:3"></div>' +
          '</div>' +
          '<button id="spinBtn" onclick="spinWheel()" style="padding:10px 28px;border-radius:10px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:14px;font-weight:700;cursor:pointer">\ud83c\udfaf SPIN!</button>' +
          '<div id="wheelResult" style="font-size:13px;font-weight:700;margin-top:8px;color:var(--gold);display:none"></div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge">+$0.050</span></div></div>';
    case 'ads7':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83e\udde0 MEMORY GAME!</div><div style="font-size:10px;color:var(--text-secondary)">Match 4 pairs to earn $0.060</div></div>' +
        '<div id="memoryArea" style="width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;padding:8px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);margin-bottom:8px">' +
          '<div style="font-size:11px;color:var(--text-muted);text-align:center;width:100%;padding:12px 0">Loading cards...</div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge">+$0.060</span></div></div>';
    case 'ads8':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83e\uddea TRIVIA CHALLENGE!</div><div style="font-size:10px;color:var(--text-secondary)">Answer 10 True/False questions for $0.070</div></div>' +
        '<div id="triviaArea" style="width:100%;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.1);padding:12px;box-sizing:border-box;margin-bottom:8px;min-height:180px">' +
          '<div id="triviaQuestion" style="font-size:14px;font-weight:600;margin-bottom:12px">Loading...</div>' +
          '<div id="triviaOptions" style="display:flex;gap:8px">' +
            '<button id="triviaTrue" onclick="answerTrivia(true)" style="flex:1;padding:12px;border-radius:10px;border:none;background:rgba(16,185,129,0.1);color:var(--emerald);font-size:14px;font-weight:700;cursor:pointer">\u2705 TRUE</button>' +
            '<button id="triviaFalse" onclick="answerTrivia(false)" style="flex:1;padding:12px;border-radius:10px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;font-size:14px;font-weight:700;cursor:pointer">\u274c FALSE</button>' +
          '</div>' +
          '<div id="triviaFeedback" style="font-size:12px;margin-top:8px;text-align:center"></div>' +
          '<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-top:8px"><span id="triviaProgress">Q1/10</span> <span id="triviaScore">Score: 0</span></div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge">+$0.070</span></div></div>';
    case 'ads10':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:6px"><div style="font-size:16px;font-weight:800;color:var(--gold)">\ud83c\udfc6 MEGA QUIZ CHALLENGE!</div><div style="font-size:10px;color:var(--text-secondary)">10 mixed questions + mini-game for $0.100</div></div>' +
        '<div id="megaQuizArea" style="width:100%;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.12);padding:12px;box-sizing:border-box;margin-bottom:8px;min-height:200px">' +
          '<div id="megaQuizContent" style="text-align:center;padding:16px 0">' +
            '<div style="font-size:36px;margin-bottom:8px">\ud83c\udfc6</div>' +
            '<div id="megaQuizStatus" style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">10 rounds of fun! Start when ready...</div>' +
            '<button id="megaQuizStartBtn" onclick="startMegaQuiz()" style="padding:12px 32px;border-radius:10px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:14px;font-weight:800;cursor:pointer">\ud83d\ude80 START CHALLENGE!</button>' +
          '</div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge" style="font-size:15px;padding:6px 20px">+$0.100</span></div></div>';
    case 'ads4':
      return '<div class="ad-inner"><div class="ad-placeholder" style="width:100%;height:180px;border-radius:16px;background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.1));border:1px solid rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:12px"><div style="font-size:48px;margin-bottom:8px">\ud83d\udd01</div><div style="font-size:13px;color:#60a5fa;font-weight:600">Monetag x2</div><div id="monetagStepText" style="font-size:11px;color:var(--text-muted);margin-top:4px">Step 1 of 2</div></div><div class="ad-label"><span id="monetagActionText">Watching ad 1...</span></div><div class="ad-reward-info"><span class="ad-earn-badge">+$0.035</span></div></div>';
    case 'ads9':
      return '<div class="ad-inner"><div class="ad-placeholder" style="width:100%;height:180px;border-radius:16px;background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(217,70,239,0.1));border:1px solid rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;flex-direction:column;margin-bottom:12px"><div style="font-size:48px">\ud83d\udd01\ud83d\udd01\ud83d\udd01</div><div style="font-size:13px;color:#a78bfa;font-weight:600">Monetag x3</div><div id="monetag3StepText" style="font-size:11px;color:var(--text-muted);margin-top:4px">Step 1 of 3</div></div><div class="ad-label"><span id="monetag3ActionText">Ad 1...</span></div><div class="ad-reward-info"><span class="ad-earn-badge">+$0.080</span></div></div>';
    case 'ads10':
      return '<div class="ad-inner">' +
        '<div style="text-align:center;margin-bottom:6px"><div style="font-size:14px;font-weight:700;color:var(--gold)">\ud83c\udfc6 MEGA COMBO!</div><div style="font-size:10px;color:var(--text-secondary)">Complete all for +$0.100</div></div>' +
        // Task 1
        '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.03);font-size:10px;margin-bottom:4px">' +
          '<span>\u2460</span><span style="flex:1;color:var(--text-secondary)">Banner</span><span id="combo1Status" style="color:var(--text-muted)">30s...</span>' +
        '</div>' +
        // Task 2: Balls
        '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.03);font-size:10px;margin-bottom:4px">' +
          '<span>\u2461</span><span style="flex:1;color:var(--text-secondary)">Tap balls</span><span id="combo2Status" style="color:var(--text-muted)">0/10</span>' +
        '</div>' +
        '<div id="comboBallArea" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:6px"></div>' +
        // Task 3: Tap
        '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.03);font-size:10px;margin-bottom:4px">' +
          '<span>\u2462</span><span style="flex:1;color:var(--text-secondary)">Tap 100x</span><span id="combo3Status" style="color:var(--text-muted)">0/100</span>' +
        '</div>' +
        '<div id="comboTapArea" style="width:100%;height:44px;border-radius:10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:6px;cursor:pointer" onclick="handleComboTap()">' +
          '<span style="font-size:12px;color:var(--text-muted)">\ud83d\udc46 Tap here!</span>' +
        '</div>' +
        // Task 4: Game
        '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.03);font-size:10px;margin-bottom:4px">' +
          '<span>\u2463</span><span style="flex:1;color:var(--text-secondary)">Click target</span><span id="combo4Status" style="color:var(--text-muted)">0/3</span>' +
        '</div>' +
        '<div id="comboGameArea" style="width:100%;height:70px;border-radius:12px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.12);position:relative;margin-bottom:8px">' +
          '<div id="comboGameTarget" style="width:28px;height:28px;border-radius:50%;background:var(--gold);position:absolute;left:10px;top:20px;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;box-shadow:0 4px 12px rgba(212,175,55,0.4)">\ud83c\udfaf</div>' +
        '</div>' +
        '<div class="ad-reward-info"><span class="ad-earn-badge" style="font-size:15px;padding:6px 20px">+$0.100</span></div>' +
      '</div>';
    default: return '<div class="ad-inner">Ad loading...</div>';
  }
}

function startAdTask(type) {
  switch(type) {
    case 'ads1': startMonetagTask(1); break;
    case 'ads2': startSmartAd(); break;
    case 'ads3': startQuiz(); break;
    case 'ads4': startMonetagTask(2); break;
    case 'ads5': startCatchCoins(); break;
    case 'ads6': /* Wheel ready on click */ break;
    case 'ads7': startMemoryGame(); break;
    case 'ads8': startTrivia(); break;
    case 'ads9': startMonetagTask(3); break;
    case 'ads10': /* Mega quiz starts on click */ break;
  }
}

function startMonetagTask(count) {
  _adStep = 0;
  function step() {
    if (_adStep >= count) { adCompleted = true; completeStep(); return; }
    _adStep++;
    var st = document.getElementById('monetagStepText') || document.getElementById('monetag3StepText');
    var at = document.getElementById('monetagActionText') || document.getElementById('monetag3ActionText');
    if (st) st.textContent = 'Step ' + _adStep + ' of ' + count;
    if (at) at.textContent = 'Watching ad ' + _adStep + '...';
    if (typeof SafeAdNetwork !== 'undefined') { SafeAdNetwork.showInterstitial(function() { setTimeout(step, 500); }); }
    else { setTimeout(step, 2000); }
  }
  step();
}

function handleBannerTap() {
  if (_bannerTapped) return;
  _bannerTapped = true;
  var c = document.getElementById('bannerAdContainer');
  var s = document.getElementById('bannerTapStatus');
  if (c) c.style.borderColor = 'var(--gold)';
  if (s) { s.textContent = '\u2705 Tapped! 15s...'; s.style.color = '#34d399'; }
  startTimerTask(15);
  // Auto-complete after 15s
  setTimeout(function() {
    if (!adCompleted) { adCompleted = true; completeStep(); }
  }, 15000);
}


// ===== SMART AD SYSTEM =====
var _smartAdClicked = false;

function startSmartAd() {
  _smartAdClicked = false;
  // Load the ad network scripts
  loadSmartAdNetworks();
}

function handleSmartAdClick() {
  if (_smartAdClicked) return;
  
  var btn = document.getElementById('smartAdClickBtn');
  var status = document.getElementById('smartAdStatus');
  var result = document.getElementById('smartAdResult');
  var pd = document.getElementById('adProgressBar');
  var td = document.getElementById('adTimerDisplay');
  
  // Push AdSense ads - create fresh script elements
  try {
    var s = document.createElement('script');
    s.text = '(adsbygoogle = window.adsbygoogle || []).push({})';
    document.head.appendChild(s);
    setTimeout(function() { if (s.parentNode) s.parentNode.removeChild(s); }, 100);
  } catch(e) {}
  
  // Open smartlink in new tab
  try { window.open('https://www.effectivecpmnetwork.com/zjzbzfk7?key=5be534a9c13e9ed7a663c6cc527b5b74', '_blank'); } catch(e) {}
  
  // Monetag popunder
  try {
    if (typeof show_9622450 !== 'undefined') {
      show_9622450({ type: 'popunder' });
    }
  } catch(e) {}
  
  // deeprootedpressure.com anti-adblock
  try {
    var a = document.createElement('iframe');
    a.src = 'https://deeprootedpressure.com/pZUde7iL?key=1541a6b21d2f36e5b1a87cf7ff04a3b5';
    a.style.display = 'none';
    document.body.appendChild(a);
  } catch(e) {}
  
  if (btn) { btn.textContent = '\u2705 Waiting...'; btn.style.opacity = '0.6'; btn.disabled = true; }
  if (status) status.textContent = '\u2705 Ads opened! Wait for completion...';
  if (result) result.style.display = 'block';
  
  _smartAdClicked = true;
  
  // Start a progress bar countdown (15 seconds)
  var countdown = 15;
  if (td) td.textContent = '0:15';
  
  var timer = setInterval(function() {
    countdown--;
    if (pd) pd.style.width = ((15 - countdown) / 15 * 100) + '%';
    if (td) td.textContent = '0:' + (countdown < 10 ? '0' : '') + countdown;
    
    if (countdown <= 0) {
      clearInterval(timer);
      if (!adCompleted) { 
        adCompleted = true; 
        if (pd) pd.style.width = '100%';
        if (td) td.textContent = 'Done!';
        completeStep(); 
      }
    }
  }, 1000);
  
  // Wait 5 seconds then credit
  setTimeout(function() {
    adCompleted = true;
    completeStep();
  }, 5000);
  
  // Load ad networks
  loadSmartAdNetworks();
  loadAntiAdblock();
}

function loadSmartAdNetworks() {
  var scripts = [
    'https://pl29828442.effectivecpmnetwork.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js',
    'https://deeprootedpressure.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js'
  ];
  scripts.forEach(function(src) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  });
}

function loadAntiAdblock() {
  var s = document.createElement('script');
  s.src = 'https://deeprootedpressure.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js';
  s.async = true;
  document.head.appendChild(s);
}

// ===== OFF AD =====
function startOffAd() {
  setTimeout(function() { handleAdClose(); }, 3000);
}

// ===== QUIZ SYSTEM (ADS3) =====
var _quizQuestions = [
  { q: 'What planet is known as the Red Planet?', opts: ['Venus', 'Mars', 'Jupiter', 'Saturn'], ans: 1 },
  { q: 'What is the largest ocean on Earth?', opts: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], ans: 3 },
  { q: 'Which country has the largest population?', opts: ['USA', 'India', 'China', 'Indonesia'], ans: 1 },
  { q: 'What element is needed for fire?', opts: ['Water', 'Oxygen', 'Nitrogen', 'Carbon'], ans: 1 },
  { q: 'How many continents are there?', opts: ['5', '6', '7', '8'], ans: 2 }
];
var _quizIndex = 0;

function startQuiz() {
  _quizIndex = 0;
  showQuizQuestion();
}

function showQuizQuestion() {
  if (_quizIndex >= _quizQuestions.length) {
    adCompleted = true; completeStep();
    return;
  }
  var q = _quizQuestions[_quizIndex];
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizProgress').textContent = 'Question ' + (_quizIndex+1) + '/5';
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizFeedback').style.color = '';
  var optsDiv = document.getElementById('quizOptions');
  optsDiv.innerHTML = '';
  q.opts.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.textContent = String.fromCharCode(65 + i) + '. ' + opt;
    btn.style.cssText = 'padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#fff;font-size:12px;cursor:pointer;text-align:left;transition:all 0.15s';
    btn.onmouseover = function() { this.style.background = 'rgba(212,175,55,0.1)'; this.style.borderColor = 'rgba(212,175,55,0.2)'; };
    btn.onmouseout = function() { this.style.background = 'rgba(255,255,255,0.04)'; this.style.borderColor = 'rgba(255,255,255,0.06)'; };
    btn.onclick = function() { answerQuiz(i); };
    optsDiv.appendChild(btn);
  });
}

function answerQuiz(idx) {
  var q = _quizQuestions[_quizIndex];
  var fb = document.getElementById('quizFeedback');
  var opts = document.getElementById('quizOptions').children;
  for (var i = 0; i < opts.length; i++) opts[i].style.pointerEvents = 'none';
  
  if (idx === q.ans) {
    fb.textContent = '\u2705 Correct!';
    fb.style.color = '#34d399';
    _quizIndex++;
    setTimeout(showQuizQuestion, 800);
  } else {
    fb.textContent = '\u274c Wrong! Correct: ' + q.opts[q.ans];
    fb.style.color = '#ef4444';
    _quizIndex++;
    setTimeout(showQuizQuestion, 1200);
  }
}

// ===== CATCH COINS GAME (ADS5) =====
var _coinInterval = null;
var _coinCount = 0;
var _coinTimeLeft = 20;
var _coinTimer = null;

function startCatchCoins() {
  _coinCount = 0;
  _coinTimeLeft = 20;
  if (_coinInterval) clearInterval(_coinInterval);
  if (_coinTimer) clearInterval(_coinTimer);
  
  document.getElementById('coinScore').textContent = '0/10 \ud83e\udeb0';
  document.getElementById('coinTimer').textContent = '20s';
  
  // Mouse/touch move to control catcher
  var area = document.getElementById('coinGameArea');
  if (area) {
    area.onmousemove = function(e) {
      var rect = area.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var catcher = document.getElementById('coinCatcher');
      if (catcher) catcher.style.left = Math.max(0, Math.min(rect.width - 50, x)) + 'px';
    };
    area.ontouchmove = function(e) {
      var rect = area.getBoundingClientRect();
      var x = e.touches[0].clientX - rect.left;
      var catcher = document.getElementById('coinCatcher');
      if (catcher) catcher.style.left = Math.max(0, Math.min(rect.width - 50, x)) + 'px';
    };
  }
  
  // Spawn coins
  _coinInterval = setInterval(spawnCoin, 800);
  
  // Timer
  _coinTimer = setInterval(function() {
    _coinTimeLeft--;
    document.getElementById('coinTimer').textContent = _coinTimeLeft + 's';
    if (_coinTimeLeft <= 0 || _coinCount >= 10) {
      clearInterval(_coinTimer);
      clearInterval(_coinInterval);
      if (_coinCount >= 10) {
        adCompleted = true; completeStep();
      } else {
        handleAdClose();
      }
    }
  }, 1000);
}

function spawnCoin() {
  var area = document.getElementById('coinGameArea');
  if (!area) return;
  var coin = document.createElement('div');
  var x = Math.random() * (area.offsetWidth - 24);
  coin.style.cssText = 'width:24px;height:24px;border-radius:50%;background:var(--gold);position:absolute;left:' + x + 'px;top:-24px;font-size:12px;display:flex;align-items:center;justify-content:center;transition:top 3s linear;z-index:1';
  coin.textContent = '\ud83e\udeb0';
  area.appendChild(coin);
  
  // Animate falling
  setTimeout(function() { coin.style.top = area.offsetHeight + 'px'; }, 10);
  
  // Check if caught
  var checkInterval = setInterval(function() {
    if (!coin.parentNode) { clearInterval(checkInterval); return; }
    var catcher = document.getElementById('coinCatcher');
    if (!catcher) { clearInterval(checkInterval); return; }
    var coinRect = coin.getBoundingClientRect();
    var catcherRect = catcher.getBoundingClientRect();
    if (coinRect.bottom >= catcherRect.top && coinRect.top <= catcherRect.bottom &&
        coinRect.right >= catcherRect.left && coinRect.left <= catcherRect.right) {
      clearInterval(checkInterval);
      coin.remove();
      _coinCount++;
      document.getElementById('coinScore').textContent = _coinCount + '/10 \ud83e\udeb0';
      if (_coinCount >= 10) {
        adCompleted = true; completeStep();
      }
    }
  }, 50);
  
  // Remove after falling
  setTimeout(function() { if (coin.parentNode) coin.remove(); }, 3500);
}

// ===== SPIN WHEEL (ADS6) =====
var _hasSpun = false;

function spinWheel() {
  if (_hasSpun) return;
  _hasSpun = true;
  
  var wheel = document.getElementById('wheelContainer');
  var result = document.getElementById('wheelResult');
  var btn = document.getElementById('spinBtn');
  
  if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
  
  // Random spin
  var degrees = 720 + Math.random() * 720;
  wheel.style.transform = 'rotate(' + degrees + 'deg)';
  
  // Determine prize
  var prizes = [
    { label: '$0.010', reward: 0.010, color: '#ef4444' },
    { label: '$0.050!', reward: 0.050, color: '#f59e0b' },
    { label: '$0.020', reward: 0.020, color: '#10b981' },
    { label: '$0.030', reward: 0.030, color: '#3b82f6' },
    { label: '$0.040', reward: 0.040, color: '#8b5cf6' },
    { label: '$0.060!!', reward: 0.060, color: '#ec4899' }
  ];
  var prize = prizes[Math.floor(Math.random() * prizes.length)];
  
  setTimeout(function() {
    if (result) {
      result.style.display = 'block';
      result.textContent = '\ud83c\udf89 You won ' + prize.label + '!';
      result.style.color = prize.color;
    }
    // Credit reward
    var earnings = prize.reward;
    var bal = parseFloat(localStorage.getItem('en_bal') || '0');
    bal += earnings;
    localStorage.setItem('en_bal', String(bal));
    
    if (currentUserData) currentUserData.balance = (currentUserData.balance || 0) + earnings;
    updateUI();
    showToast('\ud83c\udfaf', 'Spin Win!', '+' + formatCurrency(earnings) + ' from the wheel!', 'money');
    adCompleted = true;
    completeStep();
  }, 3500);
}

// ===== MEMORY GAME (ADS7) =====
var _memoryCards = [];
var _flippedCards = [];
var _matchedPairs = 0;
var _memoryLocked = false;

function startMemoryGame() {
  _memoryCards = [];
  _flippedCards = [];
  _matchedPairs = 0;
  _memoryLocked = false;
  
  var emojis = ['\ud83d\udc36', '\ud83d\udc31', '\ud83d\udc30', '\ud83d\udc3b', '\ud83e\udd85', '\ud83d\udc37', '\ud83e\udd8a', '\ud83d\udc3e'];
  emojis = emojis.slice(0, 4); // 4 pairs = 8 cards
  var cards = emojis.concat(emojis);
  // Shuffle
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = cards[i]; cards[i] = cards[j]; cards[j] = temp;
  }
  
  var area = document.getElementById('memoryArea');
  area.innerHTML = '';
  var statusLine = document.createElement('div');
  statusLine.style.cssText = 'font-size:11px;color:var(--text-muted);text-align:center;width:100%;margin-bottom:6px';
  statusLine.innerHTML = 'Match 4 pairs! <span id="memoryStatus">0/4 matched</span>';
  area.appendChild(statusLine);
  
  cards.forEach(function(emoji, idx) {
    var card = document.createElement('div');
    card.id = 'mem_' + idx;
    card.style.cssText = 'width:60px;height:60px;border-radius:10px;background:linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all 0.3s;transform:rotateY(0deg)';
    card.dataset.emoji = emoji;
    card.dataset.matched = 'false';
    card.textContent = '?';
    card.onclick = function() { flipCard(this); };
    area.appendChild(card);
  });
}

function flipCard(el) {
  if (_memoryLocked || el.dataset.matched === 'true' || _flippedCards.includes(el)) return;
  el.textContent = el.dataset.emoji;
  el.style.transform = 'rotateY(180deg)';
  el.style.background = 'rgba(212,175,55,0.1)';
  _flippedCards.push(el);
  
  if (_flippedCards.length === 2) {
    _memoryLocked = true;
    var c1 = _flippedCards[0];
    var c2 = _flippedCards[1];
    
    if (c1.dataset.emoji === c2.dataset.emoji) {
      c1.dataset.matched = 'true';
      c2.dataset.matched = 'true';
      c1.style.background = 'rgba(16,185,129,0.15)';
      c1.style.borderColor = 'rgba(16,185,129,0.3)';
      c2.style.background = 'rgba(16,185,129,0.15)';
      c2.style.borderColor = 'rgba(16,185,129,0.3)';
      _matchedPairs++;
      document.getElementById('memoryStatus').textContent = _matchedPairs + '/4 matched';
      _flippedCards = [];
      _memoryLocked = false;
      
      if (_matchedPairs >= 4) {
        adCompleted = true; completeStep();
      }
    } else {
      setTimeout(function() {
        c1.textContent = '?';
        c1.style.transform = 'rotateY(0deg)';
        c1.style.background = 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))';
        c2.textContent = '?';
        c2.style.transform = 'rotateY(0deg)';
        c2.style.background = 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))';
        _flippedCards = [];
        _memoryLocked = false;
      }, 1000);
    }
  }
}

// ===== TRIVIA (ADS8) =====
var _triviaQuestions = [
  { q: 'The Earth is flat.', ans: false },
  { q: 'Water boils at 100\u00b0C at sea level.', ans: true },
  { q: 'Humans have 5 senses.', ans: false },
  { q: 'The sun rises in the east.', ans: true },
  { q: 'Mount Everest is the tallest mountain.', ans: true },
  { q: 'Goldfish have a 3-second memory.', ans: false },
  { q: 'Lightning never strikes the same place twice.', ans: false },
  { q: 'Bananas grow on trees.', ans: false },
  { q: 'Octopuses have 3 hearts.', ans: true },
  { q: 'Diamonds are made of compressed coal.', ans: false }
];
var _triviaIndex = 0;
var _triviaCorrect = 0;

function startTrivia() {
  _triviaIndex = 0;
  _triviaCorrect = 0;
  showTriviaQuestion();
}

function showTriviaQuestion() {
  if (_triviaIndex >= _triviaQuestions.length) {
    adCompleted = true; completeStep();
    return;
  }
  var q = _triviaQuestions[_triviaIndex];
  document.getElementById('triviaQuestion').textContent = q.q;
  document.getElementById('triviaProgress').textContent = 'Q' + (_triviaIndex+1) + '/10';
  document.getElementById('triviaScore').textContent = 'Score: ' + _triviaCorrect;
  document.getElementById('triviaFeedback').textContent = '';
  document.getElementById('triviaTrue').style.pointerEvents = 'auto';
  document.getElementById('triviaFalse').style.pointerEvents = 'auto';
}

function answerTrivia(val) {
  var q = _triviaQuestions[_triviaIndex];
  var fb = document.getElementById('triviaFeedback');
  document.getElementById('triviaTrue').style.pointerEvents = 'none';
  document.getElementById('triviaFalse').style.pointerEvents = 'none';
  
  if (val === q.ans) {
    fb.textContent = '\u2705 Correct!';
    fb.style.color = '#34d399';
    _triviaCorrect++;
  } else {
    fb.textContent = '\u274c Wrong! Answer: ' + (q.ans ? 'True' : 'False');
    fb.style.color = '#ef4444';
  }
  document.getElementById('triviaScore').textContent = 'Score: ' + _triviaCorrect;
  _triviaIndex++;
  setTimeout(showTriviaQuestion, 1000);
}

// ===== MEGA QUIZ (ADS10) =====
var _megaQuizData = [
  { type: 'q', q: 'What is 7 x 8?', opts: ['54', '56', '58', '62'], ans: 1 },
  { type: 'game', desc: 'QUICK TAP! Tap 5 times!' },
  { type: 'q', q: 'Which gas do plants absorb?', opts: ['Oxygen', 'Nitrogen', 'CO2', 'Helium'], ans: 2 },
  { type: 'q', q: 'How many bones in adult human?', opts: ['106', '206', '306', '406'], ans: 1 },
  { type: 'game', desc: 'BALANCE! Click 8 times!' },
  { type: 'q', q: 'What year did WW2 end?', opts: ['1943', '1944', '1945', '1946'], ans: 2 },
  { type: 'q', q: 'Speed of light (km/s)?', opts: ['100k', '200k', '300k', '400k'], ans: 2 },
  { type: 'game', desc: 'SPEED! Tap 10 times fast!' },
  { type: 'q', q: 'Longest river in the world?', opts: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], ans: 1 },
  { type: 'q', q: 'How many elements in periodic table?', opts: ['98', '108', '118', '128'], ans: 2 }
];
var _megaIndex = 0;
var _megaTapCount = 0;
var _megaTapNeeded = 0;

function startMegaQuiz() {
  _megaIndex = 0;
  document.getElementById('megaQuizContent').innerHTML = '<div style="font-size:14px;font-weight:700;margin-bottom:8px">\ud83c\udfc6 Challenge Started!</div><div id="megaCurrentTask" style="font-size:13px;color:var(--text-secondary)">Loading...</div><div id="megaTaskArea" style="margin-top:12px"></div>';
  showMegaTask();
}

function showMegaTask() {
  if (_megaIndex >= _megaQuizData.length) {
    document.getElementById('megaQuizContent').innerHTML = '<div style="font-size:36px;margin-bottom:8px">\ud83c\udfc6</div><div style="font-size:16px;font-weight:800;color:var(--gold)">ALL DONE!</div><div style="font-size:13px;color:var(--emerald);margin-top:8px">+$0.100 earned!</div>';
    adCompleted = true; completeStep();
    return;
  }
  var task = _megaQuizData[_megaIndex];
  var area = document.getElementById('megaTaskArea');
  var status = document.getElementById('megaCurrentTask');
  area.innerHTML = '';
  
  if (task.type === 'q') {
    status.textContent = 'Question ' + (_megaIndex+1) + '/10';
    var qDiv = document.createElement('div');
    qDiv.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:10px';
    qDiv.textContent = task.q;
    area.appendChild(qDiv);
    
    task.opts.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.cssText = 'display:block;width:100%;padding:8px;margin-bottom:4px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#fff;font-size:12px;cursor:pointer';
      btn.onclick = function() {
        if (i === task.ans) {
          showToast('\u2705', 'Correct!', '', 'success');
        } else {
          showToast('\u274c', 'Wrong!', 'Correct: ' + task.opts[task.ans], 'error');
        }
        _megaIndex++;
        setTimeout(showMegaTask, 600);
      };
      area.appendChild(btn);
    });
  } else if (task.type === 'game') {
    _megaTapCount = 0;
    _megaTapNeeded = parseInt(task.desc.match(/\d+/)[0]);
    status.textContent = 'Mini-Game: ' + task.desc;
    var btn = document.createElement('button');
    btn.id = 'megaTapBtn';
    btn.style.cssText = 'width:100%;padding:20px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);color:var(--gold);font-size:20px;font-weight:800;cursor:pointer';
    btn.textContent = '\ud83d\udc46 Tap! 0/' + _megaTapNeeded;
    btn.onclick = function() {
      _megaTapCount++;
      this.textContent = '\ud83d\udc46 Tap! ' + _megaTapCount + '/' + _megaTapNeeded;
      if (_megaTapCount >= _megaTapNeeded) {
        this.textContent = '\u2705 Done!';
        this.style.background = 'rgba(16,185,129,0.1)';
        this.style.borderColor = 'rgba(16,185,129,0.2)';
        this.style.color = '#34d399';
        _megaIndex++;
        setTimeout(showMegaTask, 500);
      }
    };
    area.appendChild(btn);
  }
}


function startBannerTask() {
  var c = document.getElementById('bannerAdContainer');
  if (c) c.innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:36px;margin-bottom:8px">\ud83d\udce1</div><div style="font-size:12px;color:var(--text-secondary)">Tap the banner above</div></div>';
}

function startBallGame() {
  _ballCount = 0;
  spawnBalls();
}

function spawnBalls() {
  var area = document.getElementById('ballGameArea');
  if (!area) return;
  var count = 10 - _ballCount;
  area.innerHTML = '';
  for (var i = 0; i < count; i++) {
    var b = document.createElement('div');
    var sz = 28 + Math.floor(Math.random() * 16);
    var colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    b.style.cssText = 'width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+colors[i%colors.length]+';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;cursor:pointer;animation:giftBounce 0.5s ease;transition:transform 0.1s';
    b.textContent = i+1;
    b.onclick = function(){ tapBall(this); };
    area.appendChild(b);
  }
}

function tapBall(el) {
  if (el.style.opacity === '0.3') return;
  el.style.opacity = '0.3'; el.style.transform = 'scale(0.7)'; el.style.cursor = 'default'; el.onclick = null;
  _ballCount++;
  var ct = document.getElementById('ballCountText');
  var st = document.getElementById('ballStatusText');
  if (ct) ct.textContent = 'Tapped: '+_ballCount+'/10';
  if (_ballCount >= 10) {
    if (st) { st.textContent = '\u2705 All done!'; st.style.color = '#34d399'; }
    adCompleted = true; completeStep();
  } else {
    if (st) st.textContent = _ballCount+'/10 keep going!';
    spawnBalls();
  }
}

function startTimerTask(seconds) {
  var config = getAdConfig(currentAdType);
  var dur = seconds || config.duration || 60;
  var elapsed = 0;
  var pb = document.getElementById('adProgressBar');
  var td = document.getElementById('adTimerDisplay');
  var pp = document.getElementById('adProgressPercent');
  var ed = document.getElementById('adEarningsInline');
  if (adInterval) { clearInterval(adInterval); }
  adInterval = setInterval(function() {
    elapsed++;
    adProgress = (elapsed/dur)*100;
    if (pb) pb.style.width = Math.min(100,adProgress)+'%';
    var r = Math.max(0,dur-elapsed);
    if (td) td.textContent = Math.floor(r/60)+':'+(r%60<10?'0':'')+(r%60);
    if (pp) pp.textContent = Math.floor(adProgress)+'%';
    if (ed) ed.textContent = '+'+((elapsed/dur)*config.reward).toFixed(3);
    if (elapsed>=dur) {
      clearInterval(adInterval); adInterval=null;
      adCompleted=true;
      if(pb) pb.style.width='100%';
      if(td) td.textContent='0:00';
      if(pp) pp.textContent='100%';
      if(ed){ed.textContent='+'+config.reward.toFixed(3);ed.style.color='var(--emerald)';}
      completeStep();
    }
  }, 1000);
}

function startGameTask() {
  _gameScore = 0;
  moveTarget();
}

function moveTarget() {
  if (_gameScore >= 5) return;
  var t = document.getElementById('gameTarget');
  var a = document.getElementById('gameArea');
  if (!t||!a) return;
  var aw = Math.max(a.offsetWidth-60,100);
  var ah = Math.max(a.offsetHeight-60,100);
  t.style.left = (10+Math.random()*aw)+'px';
  t.style.top = (10+Math.random()*ah)+'px';
  t.onclick = function() {
    _gameScore++;
    var st = document.getElementById('gameScoreText');
    if (st) st.textContent = 'Nice! '+_gameScore+'/5';
    if (_gameScore>=5) { adCompleted=true; completeStep(); }
    else moveTarget();
  };
}

function startTapTask() {
  _tapCount=0; _tapStartTime=Date.now(); _tapTimes=[];
  var elapsed=0;
  if(adInterval){clearInterval(adInterval);}
  adInterval=setInterval(function(){
    elapsed++;
    var td=document.getElementById('tapTimerDisplay');
    if(td) td.textContent=Math.max(0,50-elapsed)+'s left';
    if(elapsed>=50){
      clearInterval(adInterval);adInterval=null;
      if(_tapCount>=300){adCompleted=true;completeStep();}
    }
  },1000);
}

function handleTap() {
  if(adCompleted||_rewarding) return;
  _tapCount++;
  _tapTimes.push(Date.now());
  var c=document.getElementById('tapCounter');
  var f=document.getElementById('tapProgressFill');
  var r=document.getElementById('tapRateDisplay');
  if(c) c.textContent=_tapCount;
  if(f) f.style.width=Math.min(100,(_tapCount/300)*100)+'%';
  var now=Date.now();
  var recent=_tapTimes.filter(function(t){return now-t<1000;});
  if(r) r.textContent=recent.length+'/s';
  if(_tapCount>=300){
    adCompleted=true;
    if(adInterval){clearInterval(adInterval);adInterval=null;}
    var td=document.getElementById('tapTimerDisplay');
    if(td) td.textContent='\u2705 Done!';
    completeStep();
  }
}

function startBanner2Task() { _banner1Done=false; _banner2Done=false; }

function handleBanner1Tap() {
  if(_banner1Done) return;
  _banner1Done=true;
  var s=document.getElementById('banner1Status');
  var c=document.getElementById('banner1Container');
  if(s){s.textContent='\u2705 30s wait...';s.style.color='#34d399';}
  if(c) c.style.borderColor='var(--gold)';
  var b2=document.getElementById('banner2Container');
  var b2s=document.getElementById('banner2Status');
  if(b2){b2.style.opacity='1';b2.style.pointerEvents='auto';}
  if(b2s) b2s.textContent='Tap banner 2';
  var el=0;
  var t=setInterval(function(){
    el++;
    if(el>=30){clearInterval(t);if(s)s.textContent='\u2705 Complete!';checkBanner2();}
  },1000);
}

function handleBanner2Tap() {
  if(_banner2Done) return;
  _banner2Done=true;
  var s=document.getElementById('banner2Status');
  var c=document.getElementById('banner2Container');
  if(s){s.textContent='\u2705 30s wait...';s.style.color='#34d399';}
  if(c) c.style.borderColor='var(--gold)';
  var el=0;
  var t=setInterval(function(){
    el++;
    if(el>=30){clearInterval(t);if(s)s.textContent='\u2705 Complete!';checkBanner2();}
  },1000);
}

function checkBanner2() { if(_banner1Done&&_banner2Done){adCompleted=true;completeStep();} }

function startComboTask() {
  _comboBannerDone=false;_comboBallsDone=false;_comboTapDone=false;_comboGameDone=false;_tapCount=0;_ballCount=0;_gameScore=0;
  
  // Task 1: Auto banner timer
  var el=0;
  _comboBannerTimer=setInterval(function(){
    el++;
    var s=document.getElementById('combo1Status');
    if(s) s.textContent=el+'s/30s';
    if(el>=30){
      clearInterval(_comboBannerTimer);_comboBannerTimer=null;_comboBannerDone=true;
      if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}
      checkCombo();
    }
  },1000);
  
  // Task 2: Interactive balls in the ball area
  spawnComboBalls();
  
  // Task 3: Tap area is already in HTML with onclick
  
  // Task 4: Set up game target clicks
  setTimeout(function(){
    var target=document.getElementById('comboGameTarget');
    if(target){
      target.onclick=function(){
        if(_comboGameDone) return;
        _gameScore++;
        var s=document.getElementById('combo4Status');
        if(s){s.textContent=_gameScore+'/3';s.style.color='#f59e0b';}
        if(_gameScore>=3){
          _comboGameDone=true;
          if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}
          checkCombo();
        } else {
          // Move target
          var area=document.getElementById('comboGameArea');
          if(area){
            var aw=Math.max(area.offsetWidth-40,50);
            var ah=Math.max(area.offsetHeight-40,30);
            target.style.left=(5+Math.random()*aw)+'px';
            target.style.top=(5+Math.random()*ah)+'px';
          }
        }
      };
    }
  }, 300);
}

function spawnComboBalls() {
  var area=document.getElementById('comboBallArea');
  if(!area) return;
  area.innerHTML='';
  for(var i=0;i<10;i++){
    var b=document.createElement('div');
    var colors=['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#d946ef'];
    b.style.cssText='width:28px;height:28px;border-radius:50%;background:'+colors[i]+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
    b.textContent=i+1;
    b.onclick=function(){comboBallTap(this);};
    b.onmouseover=function(){this.style.transform='scale(1.15)';};
    b.onmouseout=function(){this.style.transform='scale(1)';};
    area.appendChild(b);
  }
}

function handleComboTap() {
  if(_comboTapDone) return;
  _tapCount++;
  var s=document.getElementById('combo3Status');
  if(s){s.textContent=_tapCount+'/100';s.style.color='#f59e0b';}
  if(_tapCount>=100){
    _comboTapDone=true;
    if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}
    checkCombo();
  }
}

function comboTapHandler(e) {
  if(currentAdType!=='ads10'||_comboTapDone) return;
  _tapCount++;
  var s=document.getElementById('combo3Status');
  if(s)s.textContent=_tapCount+'/100';
  if(_tapCount>=100){_comboTapDone=true;if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}checkCombo();}
}

function comboBallTap(el) {
  if(el.style.opacity==='0.3') return;
  el.style.opacity='0.3';
  _ballCount++;
  var s=document.getElementById('combo2Status');
  if(s)s.textContent=_ballCount+'/10';
  if(_ballCount>=10){_comboBallsDone=true;if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}checkCombo();}
}

function comboGameClick() {
  _gameScore++;
  var s=document.getElementById('combo4Status');
  if(s)s.textContent=_gameScore+'/3';
  if(_gameScore>=3){_comboGameDone=true;if(s){s.textContent='\u2705 Done!';s.style.color='#34d399';}checkCombo();}
}

function checkCombo() {
  if(_comboBannerDone&&_comboBallsDone&&_comboTapDone&&_comboGameDone){adCompleted=true;completeStep();}
}

function completeStep() {
  var cb=document.getElementById('adCloseBtn');
  if(cb){cb.style.background='var(--emerald)';cb.style.color='#fff';cb.innerHTML='\u2714';}
  var pb=document.getElementById('adProgressBar');
  if(pb) pb.style.background='linear-gradient(90deg,var(--gold),var(--emerald))';
  var ed=document.getElementById('adEarningsInline');
  if(ed){ed.style.color='var(--emerald)';ed.style.fontWeight='800';}
  var el=document.getElementById('adStatusLabel');
  if(!el){
    var d=document.createElement('div');
    d.id='adStatusLabel';
    d.style.cssText='text-align:center;font-size:11px;color:var(--emerald);font-weight:600;margin-top:6px';
    d.textContent='\u2705 Complete! Tap \u2714 for reward';
    var bb=document.querySelector('.ad-bottom-bar');
    if(bb) bb.appendChild(d);
  }
}

function handleAdClose() {
  if(_rewarding) return;
  if(adCompleted){
    _rewarding=true;
    completeAd().then(function(){_showGiftOverlay();}).catch(function(){_showGiftOverlay();});
    return;
  }
  if(document.getElementById('adCloseConfirmOverlay')) return;
  var ov=document.createElement('div');
  ov.id='adCloseConfirmOverlay';
  ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
  ov.innerHTML='<div style="background:rgba(16,24,40,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px 24px;text-align:center;max-width:300px;width:90%"><div style="font-size:42px;margin-bottom:12px">\u26a0\ufe0f</div><div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f59e0b">Task not completed</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Complete the task to earn</div><div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:12px;margin-bottom:16px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Progress</div><div style="width:100%;height:6px;border-radius:6px;background:rgba(255,255,255,0.06);overflow:hidden"><div style="height:100%;width:'+adProgress+'%;border-radius:6px;background:linear-gradient(90deg,var(--gold),var(--emerald))"></div></div><div style="font-size:10px;color:var(--text-muted);margin-top:4px">'+Math.floor(adProgress)+'%</div></div><div style="display:flex;gap:8px"><button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1;padding:10px;border-radius:10px;background:var(--gold);color:#0A0E1A;border:none;font-size:13px;font-weight:700;cursor:pointer">Continue</button><button onclick="this.parentElement.parentElement.parentElement.remove();closeAdUI()" style="flex:1;padding:10px;border-radius:10px;background:rgba(255,255,255,0.06);color:var(--text-secondary);border:1px solid rgba(255,255,255,0.08);font-size:13px;font-weight:600;cursor:pointer">Give up</button></div></div>';
  document.body.appendChild(ov);
}

function closeAdUI() {
  if(adInterval){clearInterval(adInterval);adInterval=null;}
  if(_comboBannerTimer){clearInterval(_comboBannerTimer);_comboBannerTimer=null;}
  var m=$('adModal');
  if(m){m.classList.remove('show');m.innerHTML='';}
  adCompleted=false;_rewarding=false;
  // 30 min cooldown
  if (!(currentUserData && (currentUserData.isAdmin || currentUser?.email === ADMIN_EMAIL))) {
    setTimeout(function() { adCooldown = false; }, AD_COOLDOWN_MS);
  } else {
    adCooldown = false;
  }
}

function _showGiftOverlay() {
  closeAdUI();
  var g=document.createElement('div');
  g.id='giftBoxOverlay';
  g.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.5s ease';
  var cfg=getAdConfig(currentAdType);
  var rw=cfg.reward||AD_REWARD;
  g.innerHTML='<div style="text-align:center"><div style="font-size:80px;margin-bottom:16px;animation:giftBounce 1s ease infinite">\ud83c\udf81</div><div style="font-size:24px;font-weight:800;background:linear-gradient(135deg,var(--gold),#fff2c0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px">'+currentAdType.toUpperCase()+' Complete!</div><div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">+$'+rw.toFixed(3)+' added</div><div style="font-size:36px;font-weight:800;color:var(--emerald);margin-bottom:16px" id="rewardAmountDisplay2">+$'+rw.toFixed(3)+'</div><div style="font-size:28px;margin-bottom:16px">\ud83c\udf89\u2728\ud83c\udf89\u2728</div><button id="giftCloseBtn" style="padding:14px 48px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:16px;font-weight:800;cursor:pointer">Awesome! \ud83d\ude80</button></div>';
  document.body.appendChild(g);
  document.getElementById('giftCloseBtn').addEventListener('click',function(){document.getElementById('giftBoxOverlay').remove();_rewarding=false;});
  setTimeout(function(){var e=document.getElementById('giftBoxOverlay');if(e)e.remove();_rewarding=false;},6000);
}
async function completeAd() {
  dailyAdCount++;
  localStorage.setItem('en_ad_count', String(dailyAdCount));
  
  var cfg = getAdConfig(currentAdType);
  var earnings = cfg ? cfg.reward : AD_REWARD;
  var bal = parseFloat(localStorage.getItem('en_bal') || '0');
  bal += earnings;
  localStorage.setItem('en_bal', String(bal));
  
  var earned = parseFloat(localStorage.getItem('en_earned') || '0');
  earned += earnings;
  localStorage.setItem('en_earned', String(earned));
  
  var today = parseFloat(localStorage.getItem('en_today') || '0');
  today += earnings;
  localStorage.setItem('en_today', String(today));
  
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
        userId: currentUser.uid, type: 'ad_reward', amount: earnings,
        status: 'completed', description: 'Ad reward #' + watched,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) { console.warn('FS error:', e.message); }
  }
  
  // Update UI
  var timerText = $('adTimerText');
  var adStatus = $('adStatus');
  if (timerText) timerText.textContent = '✓';
  if (adStatus) {
    adStatus.textContent = '+' + formatCurrency(earnings) + ' Earned!';
    adStatus.style.color = 'var(--gold)';
  }
  
  // Update local data
  if (currentUserData) {
    currentUserData.balance = (currentUserData.balance || 0) + earnings;
    currentUserData.totalEarned = (currentUserData.totalEarned || 0) + earnings;
    currentUserData.adsWatched = (currentUserData.adsWatched || 0) + 1;
  }
  
  updateUI();
  showToast('💰', '+' + formatCurrency(earnings) + ' Earned!', 'Keep going! ' + (MAX_DAILY_ADS - dailyAdCount) + ' ads left today.', 'money');
  showConfetti();
  
  setTimeout(function() {
    var modal = $('adModal');
    if (modal) modal.classList.remove('show');
    // 30 min cooldown for non-admin
    if (!(currentUserData && (currentUserData.isAdmin || currentUser?.email === ADMIN_EMAIL))) {
      setTimeout(function() { adCooldown = false; }, AD_COOLDOWN_MS);
    } else {
      adCooldown = false;
    }
    updateAdUI();
    loadTransactions();
  }, 1800);
  
  // Check referral bonus: after 30 ads, credit referrer
  checkReferralMilestone();
}

// ===== REFERRAL BONUS SYSTEM =====
// Referrer gets $0.50 after referred user watches 30 ads
async function checkReferralMilestone() {
  if (!db || !currentUser || !currentUserData) return;
  
  // Check if referred by someone, has 30+ ads, and bonus not yet paid
  var referredBy = currentUserData.referredBy;
  var adsWatched = currentUserData.adsWatched || 0;
  var bonusPaid = currentUserData.referralBonusPaid === true;
  
  if (!referredBy || bonusPaid || adsWatched < 30) return;
  
  try {
    // Get referrer data
    var refDoc = await fbTimeout(usersRef.doc(referredBy).get());
    if (!refDoc.exists) return;
    
    // Credit referrer
    await usersRef.doc(referredBy).update({
      balance: firebase.firestore.FieldValue.increment(0.50),
      referralEarnings: firebase.firestore.FieldValue.increment(0.50),
      totalEarned: firebase.firestore.FieldValue.increment(0.50)
    });
    
    // Mark as paid for referred user
    await usersRef.doc(currentUser.uid).update({
      referralBonusPaid: true
    });
    currentUserData.referralBonusPaid = true;
    
    // Update referral document
    var refSnap = await fbTimeout(referralsRef.where('referredId', '==', currentUser.uid).get());
    if (!refSnap.empty) {
      refSnap.forEach(function(doc) {
        doc.ref.update({ bonusPaid: true });
      });
    }
    
    // Log transaction for referrer
    await transactionsRef.add({
      userId: referredBy, type: 'referral_bonus', amount: 0.50,
      status: 'completed',
      description: 'Referral bonus for ' + (currentUserData.name || currentUser.email) + ' (30 ads completed)',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('🎉', 'Referral Bonus Earned!', 'Your referrer earned $0.50 because you watched 30 ads!', 'success');
    
  } catch(e) { console.warn('Referral bonus error:', e.message); }
}

// ===== WITHDRAWAL =====
var selectedWDMethod = null;
var wdFields = {
  bkash: ['bKash Number'], nagad: ['Nagad Number'],
  binance: ['Binance ID', 'Email'], paypal: ['PayPal Email'],
  wise: ['Account Number', 'Routing Number'],
  bank: ['Account Name', 'Account Number', 'Bank Name', 'Routing Number'],
  crypto: ['Wallet Address', 'Network (BTC/ETH/USDT)'], stripe: ['Stripe Account ID']
};

function selectWDMethod(method) {
  selectedWDMethod = method;
  qsa('.wd-item').forEach(function(el) { el.classList.remove('active'); });
  var idx = ['bkash','nagad','binance','paypal','wise','bank','crypto','stripe'].indexOf(method) + 1;
  var target = qs('.wd-item:nth-child(' + idx + ')');
  if (target) target.classList.add('active');
  
  var form = $('wdForm');
  if (form) form.style.display = 'block';
  
  var fields = $('wdFields');
  if (!fields) return;
  fields.innerHTML = '';
  (wdFields[method] || ['Account details']).forEach(function(f) {
    var input = document.createElement('input');
    input.className = 'wd-input';
    input.setAttribute('data-wd-field', f);
    input.placeholder = f;
    input.required = true;
    fields.appendChild(input);
  });
}

async function requestWithdrawal() {
  if (!db || !currentUser) { showToast('⚠️', 'Offline', 'Withdrawals require internet.', 'error'); return; }
  if (!selectedWDMethod) { showToast('⚠️', 'Select Method', 'Choose a payment method first.', 'warning'); return; }
  
  var amount = parseFloat($('wdAmount')?.value);
  if (!amount || amount < 5) { showToast('⚠️', 'Minimum $5.00', 'Withdrawals must be at least $5.00.', 'warning'); return; }
  
  var bal = currentUserData?.balance || parseFloat(localStorage.getItem('en_bal') || '0');
  if (amount > bal) { showToast('⚠️', 'Insufficient Balance', 'You don\'t have enough funds.', 'error'); return; }
  
  var accountDetails = {};
  qsa('[data-wd-field]').forEach(function(el) { accountDetails[el.dataset.wdField] = el.value; });
  
  var hasEmpty = Object.values(accountDetails).some(function(v) { return !v || !v.trim(); });
  if (hasEmpty) { showToast('⚠️', 'Fill All Fields', 'Please complete all account details.', 'warning'); return; }
  
  try {
    await fbTimeout(withdrawalsRef.add({
      userId: currentUser.uid, method: selectedWDMethod, amount: amount,
      fee: amount * 0.05, accountDetails: accountDetails, status: 'pending', adminNote: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    await fbTimeout(usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount)
    }));
    await fbTimeout(transactionsRef.add({
      userId: currentUser.uid, type: 'withdrawal', amount: -amount,
      status: 'pending', description: 'Withdrawal via ' + selectedWDMethod,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    
    // Update local
    if (currentUserData) currentUserData.balance = (currentUserData.balance || 0) - amount;
    localStorage.setItem('en_bal', String(parseFloat(localStorage.getItem('en_bal') || '0') - amount));
    
    showToast('✅', 'Withdrawal Requested!', formatCurrency(amount) + ' via ' + selectedWDMethod + '. Pending approval.', 'success');
    $('wdAmount').value = '';
    qsa('[data-wd-field]').forEach(function(el) { el.value = ''; });
    updateUI();
    animateBalance();
    loadTransactions();
    loadWithdrawals();
  } catch(e) {
    showToast('❌', 'Error', e.message || 'Withdrawal failed. Try again.', 'error');
  }
}

// Render page-level AdSense banner
function renderPageBanner(containerId) {
  var c = document.getElementById(containerId);
  if (!c) return;
  try {
    c.innerHTML = '<ins class="adsbygoogle" style="display:inline-block;width:320px;height:100px" data-ad-client="ca-pub-9307459733796967" data-ad-slot="3746278661"></ins>';
    var s = document.createElement('script');
    s.text = '(adsbygoogle = window.adsbygoogle || []).push({})';
    c.appendChild(s);
  } catch(e) {}
}

async function loadWithdrawals() {
  var container = $('wdHistory');
  if (!container) return;
  
  if (!db || !currentUser) return;
  
  try {
    var snap = await fbTimeout(
      withdrawalsRef.where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc').limit(10).get()
    );
    
    container.innerHTML = '';
    if (snap.empty) {
      container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:32px">💳</div><div class="empty-desc">No withdrawals yet</div></div>';
      return;
    }
    
    snap.forEach(function(doc) {
      var d = doc.data();
      var date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
      var color = d.status === 'approved' ? 'var(--emerald)' : d.status === 'rejected' ? 'var(--red)' : 'var(--gold)';
      var icons = { 'pending': '⏳', 'approved': '✅', 'rejected': '❌', 'refunded': '🔄' };
      
      container.innerHTML +=
        '<div class="tx-item">' +
          '<div class="tx-icon">' + (icons[d.status] || '💳') + '</div>' +
          '<div class="tx-info"><div class="tx-desc">' + formatCurrency(d.amount) + ' via ' + (d.method || '?') + '</div><div class="tx-date">' + formatDate(date) + '</div></div>' +
          '<span style="font-size:11px;font-weight:600;color:' + color + '">' + (d.status || 'pending').toUpperCase() + '</span>' +
        '</div>';
    });
  } catch(e) {
    // Silent fail
  }
}

// ===== REFERRAL =====
function copyReferral() {
  var code = currentUserData?.referralCode || 'N/A';
  var text = '💰 Join EARNNOVA and earn $0.50!\n\nSign up with my referral link: https://earnnova-web.vercel.app/register.html?ref=' + code;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('📋', 'Copied!', 'Referral link with code copied! Share it with friends!', 'success');
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('📋', 'Copied!', 'Referral link copied!', 'success');
  }
}

// ===== ADMIN =====
function toggleAdmin() {
  $('adminOverlay')?.classList.toggle('show');
  if ($('adminOverlay')?.classList.contains('show')) {
    adminLoadStats();
    adminShowRoleBadge();
  }
}

function adminSwitchTab(tab) {
  qsa('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
  var tabEl = qs('.admin-tab[data-tab="' + tab + '"]');
  if (tabEl) tabEl.classList.add('active');
  
  qsa('.admin-section').forEach(function(s) { s.classList.remove('active'); });
  var section = $('adminSection' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (section) section.classList.add('active');
  
  // Load data
  if (tab === 'users') adminLoadUsers();
  if (tab === 'withdrawals') adminLoadWD();
}

async function adminLoadStats() {
  if (!db) return;
  try {
    var uSnap = await fbTimeout(usersRef.get());
    var wSnap = await fbTimeout(withdrawalsRef.where('status', '==', 'pending').get());
    var total = 0;
    uSnap.forEach(function(d) { total += d.data().balance || 0; });
    if ($('adminUsers')) $('adminUsers').textContent = uSnap.size;
    if ($('adminWD')) $('adminWD').textContent = wSnap.size;
    if ($('adminBalance')) $('adminBalance').textContent = formatCurrency(total);
  } catch(e) {}
}

async function adminLoadUsers() {
  var container = $('adminUsersList');
  if (!container || !db) return;
  container.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
  
  try {
    var snap = await fbTimeout(usersRef.orderBy('createdAt', 'desc').limit(50).get());
    container.innerHTML = '';
    snap.forEach(function(doc) {
      var d = doc.data();
      var isBanned = d.isActive === false;
      container.innerHTML +=
        '<div class="glass-card-sm flex justify-between items-center" style="margin-bottom:8px;' + (isBanned ? 'opacity:0.5' : '') + '">' +
          '<div><div style="font-size:13px;font-weight:600">' + (d.name || '?') + '</div>' +
          '<div style="font-size:10px;color:var(--text-muted)">' + (d.email || '') + ' • ID: ' + doc.id.slice(0,8) + '... • ' + formatCurrency(d.balance || 0) + '</div></div>' +
          '<div class="flex gap-1 items-center">' +
            (isBanned ? '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,0.12);color:#ef4444">BANNED</span>' : '') +
            (d.isAdmin === true ? '<span class="text-gold fw-600 text-xs" style="padding:2px 8px;border-radius:4px;background:rgba(212,175,55,0.1)">ADMIN</span>' : '') +
            (d.isAdmin === 'child' ? '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(99,102,241,0.1);color:#6366f1">CHILD</span>' : '') +
            '<span style="font-size:10px;color:var(--text-muted)">' + (d.adsWatched || 0) + '</span>' +
            '<button class="btn-small" onclick="adminViewUser(\'' + doc.id + '\')" style="padding:3px 8px;font-size:9px;border-radius:4px;border:none;background:rgba(16,185,129,0.1);color:var(--emerald);cursor:pointer">View</button>' +
          '</div>' +
        '</div>';
    });
    if (snap.empty) container.innerHTML = '<div class="empty-state"><div class="empty-desc">No users</div></div>';
  } catch(e) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-desc">Error loading users</div></div>'; }
}

async function adminLoadWD() {
  var container = $('adminWDList');
  if (!container || !db) return;
  container.innerHTML = '<div class="skeleton skeleton-card"></div>';
  
  try {
    var snap = await fbTimeout(withdrawalsRef.orderBy('createdAt', 'desc').limit(50).get());
    container.innerHTML = '';
    snap.forEach(function(doc) {
      var d = doc.data();
      var date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
      var color = d.status === 'approved' ? 'var(--emerald)' : d.status === 'rejected' ? 'var(--red)' : 'var(--gold)';
      container.innerHTML +=
        '<div class="glass-card-sm" style="margin-bottom:8px">' +
          '<div class="flex justify-between items-center">' +
            '<div><div class="text-sm fw-600">' + formatCurrency(d.amount) + ' via ' + (d.method || '?') + '</div>' +
            '<div class="text-xs text-muted">' + formatDate(date) + '</div></div>' +
            '<span class="text-xs fw-600" style="color:' + color + '">' + (d.status || '').toUpperCase() + '</span>' +
          '</div>' +
        '</div>';
    });
    if (snap.empty) container.innerHTML = '<div class="empty-state"><div class="empty-desc">No withdrawals</div></div>';
  } catch(e) { container.innerHTML = '<div class="empty-state"><div class="empty-desc">Error</div></div>'; }
}

// ===== ADMIN FUNCTIONS =====

// Search user by UID or email
async function adminSearchUser() {
  var q = document.getElementById('adminSearchInput')?.value?.trim();
  if (!q) { showToast('⚠️','Empty','Enter a UID or email to search','warning'); return; }
  
  var container = document.getElementById('adminUsersList');
  if (!container) return;
  container.innerHTML = '<div class="skeleton skeleton-card"></div>';
  
  try {
    // Try by UID first
    var doc = await fbTimeout(usersRef.doc(q).get());
    if (doc.exists) {
      showResult(doc);
      return;
    }
    // Try by email
    var snap = await fbTimeout(usersRef.where('email', '==', q).get());
    if (!snap.empty) {
      snap.forEach(function(d) { showResult(d); });
      return;
    }
    container.innerHTML = '<div class="empty-state"><div class="empty-desc">User not found</div></div>';
  } catch(e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-desc">Error: ' + e.message + '</div></div>';
  }
  
  function showResult(doc) {
    var d = doc.data();
    container.innerHTML = 
      '<div class="glass-card-sm" style="margin-bottom:8px">' +
        '<div class="flex justify-between items-center">' +
          '<div><div style="font-size:13px;font-weight:600">' + (d.name || '?') + '</div>' +
          '<div style="font-size:10px;color:var(--text-muted)">' + (d.email || '') + '<br>UID: ' + doc.id + '</div></div>' +
          '<button class="btn-small" onclick="adminViewUser(\'' + doc.id + '\')" style="padding:6px 12px;border-radius:6px;border:none;background:var(--emerald);color:#fff;font-weight:600;cursor:pointer">View Profile</button>' +
        '</div>' +
      '</div>';
  }
}

// View user details with actions
async function adminViewUser(uid) {
  var modal = document.getElementById('userDetailModal');
  var content = document.getElementById('userDetailContent');
  if (!modal || !content) return;
  
  content.innerHTML = '<div class="text-xs text-muted">Loading...</div>';
  modal.classList.add('show');
  
  try {
    var doc = await fbTimeout(usersRef.doc(uid).get());
    if (!doc.exists) { content.innerHTML = '<div class="empty-state"><div class="empty-desc">User not found</div></div>'; return; }
    
    var d = doc.data();
    var isCreator = currentUser?.email === ADMIN_EMAIL;
    var isThisUser = currentUser?.uid === uid;
    var roleLabel = d.isAdmin === true ? '👑 Full Admin' : d.isAdmin === 'child' ? '🔹 Child Admin' : '👤 User';
    
    var html = 
      '<div class="glass-card-sm" style="padding:16px;margin-bottom:12px">' +
        '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' +
          '<div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--emerald));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#0A0E1A">' + (d.name?.[0] || 'U').toUpperCase() + '</div>' +
          '<div><div style="font-size:16px;font-weight:700">' + (d.name || 'Unknown') + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted)">' + (d.email || 'No email') + '</div>' +
          '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + roleLabel + '</div></div>' +
        '</div>' +
        '<div class="flex gap-2" style="flex-wrap:wrap;margin-bottom:8px">' +
          '<div class="admin-stat-card" style="flex:1;min-width:60px;padding:8px"><div class="admin-stat-val" style="font-size:14px">' + formatCurrency(d.balance || 0) + '</div><div class="admin-stat-lbl" style="font-size:9px">Balance</div></div>' +
          '<div class="admin-stat-card" style="flex:1;min-width:60px;padding:8px"><div class="admin-stat-val" style="font-size:14px">' + (d.adsWatched || 0) + '</div><div class="admin-stat-lbl" style="font-size:9px">Ads</div></div>' +
          '<div class="admin-stat-card" style="flex:1;min-width:60px;padding:8px"><div class="admin-stat-val" style="font-size:14px">' + (d.todayAds || 0) + '</div><div class="admin-stat-lbl" style="font-size:9px">Today</div></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted)">UID: <span style="font-family:monospace">' + uid + '</span></div>' +
        '<div style="font-size:10px;color:var(--text-muted)">Referred: ' + (d.referralCount || 0) + ' users</div>' +
        '<div style="font-size:10px;color:var(--text-muted)">Referral Earnings: ' + formatCurrency(d.referralEarnings || 0) + '</div>' +
      '</div>';
    
    // Actions (not for yourself)
    if (!isThisUser) {
      html += '<div class="glass-card-sm" style="padding:16px;margin-bottom:8px">';
      html += '<div class="fw-600 text-sm mb-2">Actions</div>';
      
      //       // Ban/Unban (admin+) - CANNOT ban owner
      if (d.email !== ADMIN_EMAIL) {
        html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
        html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:' + (d.isActive === false ? 'rgba(16,185,129,0.12);color:var(--emerald)' : 'rgba(239,68,68,0.12);color:#ef4444') + ';font-weight:600;cursor:pointer" onclick="adminToggleBan(\'' + uid + '\',' + (d.isActive === false ? 'true' : 'false') + ')">' + (d.isActive === false ? '✅ Unban' : '🚫 Ban') + '</button>';
        html += '</div>';
      } else {
        html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
        html += '<div style="padding:8px;font-size:11px;color:var(--gold);font-weight:600">👑 Owner account - protected</div>';
        html += '</div>';
      }
      
      // Promote/Demote (creator only)
      if (isCreator) {
        if (!d.isAdmin) {
          html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(212,175,55,0.12);color:var(--gold);font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'admin\')">👑 Make Admin</button>';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(99,102,241,0.12);color:#6366f1;font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'child\')">🔹 Make Child Admin</button>';
          html += '</div>';
        } else if (d.isAdmin === 'child') {
          html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(212,175,55,0.12);color:var(--gold);font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'admin\')">👑 Promote to Admin</button>';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'user\')">⬇ Demote to User</button>';
          html += '</div>';
        } else {
          html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(99,102,241,0.12);color:#6366f1;font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'child\')">🔹 Make Child Admin</button>';
          html += '<button class="btn-small" style="flex:1;padding:8px;border-radius:8px;border:none;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:600;cursor:pointer" onclick="adminSetRole(\'' + uid + '\',\'user\')">⬇ Demote to User</button>';
          html += '</div>';
        }
      }
      
      // Ad Limit (admin+)
      html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
      html += '<input id="adLimitInput" type="number" placeholder="Ad limit" style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#fff;font-size:12px;outline:none">';
      html += '<button class="btn-small" style="padding:8px 12px;border-radius:8px;border:none;background:rgba(16,185,129,0.12);color:var(--emerald);font-weight:600;cursor:pointer" onclick="adminSetAdLimit(\'' + uid + '\')">Set</button>';
      html += '</div>';
      
      // Balance adjust (admin+)
      html += '<div class="action-row" style="display:flex;gap:6px;margin-bottom:6px">';
      html += '<input id="balanceAdjustInput" type="number" placeholder="Amount" step="0.01" style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#fff;font-size:12px;outline:none">';
      html += '<button class="btn-small" style="padding:8px 12px;border-radius:8px;border:none;background:rgba(16,185,129,0.12);color:var(--emerald);font-weight:600;cursor:pointer" onclick="adminAddBalance(\'' + uid + '\')">+</button>';
      html += '<button class="btn-small" style="padding:8px 12px;border-radius:8px;border:none;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:600;cursor:pointer" onclick="adminSubBalance(\'' + uid + '\')">−</button>';
      html += '</div>';
      
      // Send notification to user
      html += '<div class="action-row" style="display:flex;gap:6px">';
      html += '<input id="adminNotifSingle" type="text" placeholder="Personal notification..." style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#fff;font-size:12px;outline:none">';
      html += '<button class="btn-small" style="padding:8px 12px;border-radius:8px;border:none;background:rgba(245,158,11,0.12);color:#f59e0b;font-weight:600;cursor:pointer" onclick="adminNotifSingle(\'' + uid + '\')">Send</button>';
      html += '</div>';
      
      html += '</div>';
    }
    
    content.innerHTML = html;
    document.getElementById('userDetailTitle').textContent = d.name || 'User Details';
  } catch(e) {
    content.innerHTML = '<div class="empty-state"><div class="empty-desc">Error: ' + e.message + '</div></div>';
  }
}

function closeUserDetail() {
  document.getElementById('userDetailModal')?.classList.remove('show');
}

// Ban / Unban
async function adminToggleBan(uid, currentlyBanned) {
  if (!confirm(currentlyBanned ? 'Unban this user?' : 'Ban this user? They will not be able to login or earn.')) return;
  try {
    // Check if target user is the owner - CANNOT ban owner
    var targetDoc = await fbTimeout(usersRef.doc(uid).get());
    if (targetDoc.exists && targetDoc.data().email === ADMIN_EMAIL) {
      showToast('❌','Protected','Cannot ban the owner account!','error');
      return;
    }
    await fbTimeout(usersRef.doc(uid).update({ isActive: currentlyBanned }));
    showToast('✅', currentlyBanned ? 'Unbanned!' : 'Banned!', currentlyBanned ? 'User can now login and earn.' : 'User has been banned.','success');
    adminViewUser(uid);
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Set Role (creator only)
async function adminSetRole(uid, role) {
  if (currentUser?.email !== ADMIN_EMAIL) { showToast('❌','Denied','Only creator can change roles','error'); return; }
  // Cannot modify owner account
  var targetDoc = await fbTimeout(usersRef.doc(uid).get());
  if (targetDoc.exists && targetDoc.data().email === ADMIN_EMAIL) {
    showToast('❌','Protected','Cannot modify the owner account role!','error');
    return;
  }
  var labels = { admin: 'Full Admin', child: 'Child Admin', user: 'User' };
  if (!confirm('Set ' + labels[role] + ' role for this user?')) return;
  try {
    await fbTimeout(usersRef.doc(uid).update({ isAdmin: role === 'admin' ? true : (role === 'child' ? 'child' : false) }));
    showToast('✅','Role Updated','User is now: ' + labels[role],'success');
    adminViewUser(uid);
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Set custom ad limit
async function adminSetAdLimit(uid) {
  var val = parseInt(document.getElementById('adLimitInput')?.value);
  if (isNaN(val) || val < 0) { showToast('⚠️','Invalid','Enter a valid number (0+)','warning'); return; }
  try {
    await fbTimeout(usersRef.doc(uid).update({ customAdLimit: val }));
    showToast('✅','Limit Set','User ad limit: ' + val + '/day','success');
    document.getElementById('adLimitInput').value = '';
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Add balance
async function adminAddBalance(uid) {
  var val = parseFloat(document.getElementById('balanceAdjustInput')?.value);
  if (isNaN(val) || val <= 0) { showToast('⚠️','Invalid','Enter a valid amount','warning'); return; }
  try {
    await fbTimeout(usersRef.doc(uid).update({ balance: firebase.firestore.FieldValue.increment(val) }));
    showToast('✅','Added','+${formatCurrency(val)} to user balance','success');
    document.getElementById('balanceAdjustInput').value = '';
    adminViewUser(uid);
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Subtract balance
async function adminSubBalance(uid) {
  var val = parseFloat(document.getElementById('balanceAdjustInput')?.value);
  if (isNaN(val) || val <= 0) { showToast('⚠️','Invalid','Enter a valid amount','warning'); return; }
  try {
    await fbTimeout(usersRef.doc(uid).update({ balance: firebase.firestore.FieldValue.increment(-val) }));
    showToast('✅','Subtracted','-${formatCurrency(val)} from user balance','success');
    document.getElementById('balanceAdjustInput').value = '';
    adminViewUser(uid);
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Send notification to all users
async function adminSendNotif(target) {
  var text = document.getElementById('adminNotifText')?.value?.trim();
  if (!text) { showToast('⚠️','Empty','Write a notification message','warning'); return; }
  if (!confirm('Send this notification to ' + target + ' users?')) return;
  
  try {
    // Store in a notifications collection
    var notifRef = db.collection('notifications');
    await notifRef.add({
      message: text, target: target,
      sentBy: currentUser?.email || 'admin',
      sentAt: firebase.firestore.FieldValue.serverTimestamp(),
      readBy: []
    });
    showToast('✅','Sent!','Notification sent to ' + target + ' users','success');
    document.getElementById('adminNotifText').value = '';
    loadNotifHistory();
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Send notification to single user
async function adminNotifSingle(uid) {
  var text = document.getElementById('adminNotifSingle')?.value?.trim();
  if (!text) { showToast('⚠️','Empty','Write a message','warning'); return; }
  try {
    var notifRef = db.collection('notifications');
    await notifRef.add({
      message: text, target: 'single', userId: uid,
      sentBy: currentUser?.email || 'admin',
      sentAt: firebase.firestore.FieldValue.serverTimestamp(),
      readBy: []
    });
    showToast('✅','Sent!','Personal notification sent','success');
    document.getElementById('adminNotifSingle').value = '';
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

async function loadNotifHistory() {
  var container = document.getElementById('adminNotifHistory');
  if (!container || !db) return;
  try {
    var snap = await fbTimeout(db.collection('notifications').orderBy('sentAt', 'desc').limit(20).get());
    if (snap.empty) { container.innerHTML = '<div class="text-xs text-muted">No notifications sent yet</div>'; return; }
    container.innerHTML = '';
    snap.forEach(function(doc) {
      var d = doc.data();
      var date = d.sentAt?.toDate ? d.sentAt.toDate() : new Date();
      container.innerHTML += 
        '<div style="font-size:11px;padding:8px;border-bottom:1px solid rgba(255,255,255,0.04)">' +
          '<div>' + d.message + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px">To: ' + (d.target || 'all') + (d.userId ? ' (user)' : '') + ' • ' + formatDate(date) + '</div>' +
        '</div>';
    });
  } catch(e) {
    container.innerHTML = '<div class="text-xs text-muted">Error loading history</div>';
  }
}

// Save admin settings
async function adminSaveSettings() {
  var minWD = parseFloat(document.getElementById('adminMinWD')?.value);
  var adReward = parseFloat(document.getElementById('adminAdReward')?.value);
  var refBonus = parseFloat(document.getElementById('adminRefBonus')?.value);
  
  if (isNaN(minWD) || isNaN(adReward) || isNaN(refBonus)) {
    showToast('⚠️','Invalid','Check all values','warning'); return;
  }
  
  try {
    // Save to Firestore config doc
    await fbTimeout(db.collection('config').doc('app').set({
      minWithdrawal: minWD, adReward: adReward, refBonus: refBonus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: currentUser?.email || 'admin'
    }, { merge: true }));
    showToast('✅','Saved!','Settings updated successfully','success');
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Load admin settings
async function adminLoadSettings() {
  try {
    var doc = await fbTimeout(db.collection('config').doc('app').get());
    if (doc.exists) {
      var d = doc.data();
      if (document.getElementById('adminMinWD')) document.getElementById('adminMinWD').value = d.minWithdrawal || 5;
      if (document.getElementById('adminAdReward')) document.getElementById('adminAdReward').value = d.adReward || 0.02;
      if (document.getElementById('adminRefBonus')) document.getElementById('adminRefBonus').value = d.refBonus || 0.50;
    }
  } catch(e) {}
}

// Profile editing
function editProfile() {
  var modal = document.getElementById('profileEditModal');
  if (!modal) return;
  if (document.getElementById('profileEditName')) document.getElementById('profileEditName').value = currentUserData?.name || '';
  if (document.getElementById('profileEditPhoto')) document.getElementById('profileEditPhoto').value = currentUserData?.photo || '';
  if (document.getElementById('profileEditPhone')) document.getElementById('profileEditPhone').value = currentUserData?.phone || '';
  modal.classList.add('show');
}

async function saveProfile() {
  var name = document.getElementById('profileEditName')?.value?.trim();
  var photo = document.getElementById('profileEditPhoto')?.value?.trim();
  var phone = document.getElementById('profileEditPhone')?.value?.trim();
  
  if (!name) { showToast('⚠️','Empty','Name cannot be empty','warning'); return; }
  
  try {
    var updateData = { name: name };
    if (photo) updateData.photo = photo;
    if (phone) updateData.phone = phone;
    
    await fbTimeout(usersRef.doc(currentUser.uid).update(updateData));
    
    if (currentUserData) {
      currentUserData.name = name;
      if (photo) currentUserData.photo = photo;
      if (phone) currentUserData.phone = phone;
    }
    
    showToast('✅','Saved!','Profile updated successfully','success');
    document.getElementById('profileEditModal')?.classList.remove('show');
    updateUI();
  } catch(e) { showToast('❌','Error',e.message,'error'); }
}

// Extend adminSwitchTab
var _origAdminSwitch = adminSwitchTab;
adminSwitchTab = function(tab) {
  if (_origAdminSwitch) _origAdminSwitch(tab);
  if (tab === 'notifications') loadNotifHistory();
  if (tab === 'settings') adminLoadSettings();
};

// Show role badge in admin panel
function adminShowRoleBadge() {
  var badge = document.getElementById('adminRoleBadge');
  if (!badge) return;
  if (currentUser?.email === ADMIN_EMAIL) {
    badge.style.display = 'inline-block';
    badge.textContent = 'CREATOR';
  } else {
    badge.style.display = 'none';
  }
}

// ===== LOGOUT =====


// ===== OTP SYSTEM =====
function generateOTP() {
  var code = '';
  for (var i = 0; i < 6; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

function sendOTP(email, callback) {
  if (!db) { if (callback) callback('Database not ready'); return; }
  var code = generateOTP();
  var expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  db.collection('otp_codes').add({
    code: code, used: false, email: email || '',
    userId: currentUser ? currentUser.uid : '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAt
  }).then(function() {
    console.log('📱 OTP for ' + email + ': ' + code);
    localStorage.setItem('en_last_otp', code);
    localStorage.setItem('en_otp_expires', expiresAt.getTime().toString());
    if (callback) callback(null, code);
  }).catch(function(err) {
    if (callback) callback(err.message);
  });
}

function requestOTP(type, callback) {
  // type: 'withdraw', 'login', 'reset', 'verify'
  var email = currentUserData?.email || '';
  sendOTP(email, function(err, code) {
    if (err) {
      showToast('❌','Failed to send OTP: ' + err, 'error');
      if (callback) callback(err);
      return;
    }
    showToast('📨','OTP sent! Check console or below','success');
    console.log('📱 OTP Code: ' + code + ' (for: ' + type + ')');
    if (callback) callback(null, code);
    
    // Redirect to verify page
    var redirectUrl = window.location.pathname.replace(/\/[^\/]*$/, '/') + 'verify.html';
    var mode = type || 'verify';
    var redir = window.location.href;
    window.location.href = redirectUrl + '?mode=' + mode + '&redirect=' + encodeURIComponent(redir) + '&uid=' + (currentUser ? currentUser.uid : '');
  });
}

function verifyOTPCode(code, callback) {
  if (!db) { if (callback) callback('Database not ready'); return; }
  db.collection('otp_codes').where('code', '==', code).where('used', '==', false).get()
    .then(function(snap) {
      if (snap.empty) {
        if (callback) callback('Invalid or expired OTP');
        return;
      }
      var doc = snap.docs[0];
      var data = doc.data();
      var expiry = data.expiresAt ? data.expiresAt.toDate() : new Date();
      if (Date.now() > expiry.getTime()) {
        db.collection('otp_codes').doc(doc.id).update({ used: true });
        if (callback) callback('OTP expired');
        return;
      }
      // Mark as used
      db.collection('otp_codes').doc(doc.id).update({
        used: true, verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      localStorage.setItem('en_otp_verified', 'true');
      if (callback) callback(null, data);
    }).catch(function(err) {
      if (callback) callback(err.message);
    });
}


// ===== SHORTLINK SYSTEM =====
var VPLLINK_API = "a6e0be57ade7b64c335c47b1e46ae6d9b085257f";
var ANTI_BYPASS = "1afc548813e7d554c47f8aa940e974b14662c247af4cdc353f31a205e0fa78b1";

function createShortLink(url, alias) {
  var apiUrl = 'https://vplink.in/api?api=' + VPLLINK_API + '&url=' + encodeURIComponent(url);
  if (alias) apiUrl += '&alias=' + encodeURIComponent(alias);
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try { var d = JSON.parse(xhr.responseText); console.log('🔗 Shortlink:', d.shorturl || d.url); } catch(e) {}
      }
    };
    xhr.send();
  } catch(e) {}
}

function loadLinkvertise() {
  var s = document.createElement('script');
  s.src = 'https://publisher.linkvertise.com/cdn/linkvertise.js';
  s.onload = function() { try { linkvertise(1424242, {whitelist:[], blacklist:[""]}); } catch(e) {} };
  document.head.appendChild(s);
}

function openLinkvertise(url) {
  var gateUrl = 'https://link-to.net/1424242/' + Math.random()*1000 + '/?href=' + encodeURIComponent(url);
  window.open(gateUrl, '_blank');
}

function getAntiBypassToken() { return ANTI_BYPASS; }

function addAntiBypass(url) {
  var sep = url.includes('?') ? '&' : '?';
  return url + sep + 'ab_token=' + ANTI_BYPASS;
}

function getEarnLink(type) {
  var baseUrl = window.location.origin;
  var earnUrl = baseUrl + '/earn.html?ad=' + type + '&uid=' + (currentUser ? currentUser.uid : 'guest');
  return addAntiBypass(earnUrl);
}

// Load linkvertise on earn page
if (window.location.pathname.includes('earn') || window.location.pathname.includes('home')) {
  setTimeout(loadLinkvertise, 2000);
}

function logout() {
  if (auth) {
    auth.signOut().then(function() {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  } else {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
  navigate('home');
});
