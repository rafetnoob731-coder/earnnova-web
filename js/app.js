// =============================================
// EARNNOVA BETA - Main Application
// =============================================

let currentPage = 'dashboard';

// Initialize app after user data loaded
function initApp(userData) {
  document.getElementById('splash').classList.add('hide');
  showPage('appPage');
  
  // Update UI with user data
  updateUI(userData);
  showNotificationPopup();
  
  // Navigate to dashboard
  navigate('dashboard');
}

function updateUI(userData) {
  const d = userData || currentUserData;
  if (!d) return;
  
  document.getElementById('dashName').textContent = d.name || 'User';
  document.getElementById('balanceDisplay').textContent = '$' + (d.balance || 0).toFixed(2);
  document.getElementById('statAds').textContent = d.adsWatched || 0;
  document.getElementById('statEarned').textContent = '$' + (d.totalEarned || 0).toFixed(2);
  document.getElementById('wdBalance').textContent = '$' + (d.balance || 0).toFixed(2);
  document.getElementById('topAvatar').textContent = (d.name || 'U')[0].toUpperCase();
  document.getElementById('profAvatar').textContent = (d.name || 'U')[0].toUpperCase();
  document.getElementById('profName').textContent = d.name || 'User';
  document.getElementById('profEmail').textContent = d.email || '';
  document.getElementById('profEditName').value = d.name || '';
  document.getElementById('profEditPhone').value = d.phone || '';
  
  // Referral link
  const refLink = `${window.location.origin}/?ref=${d.referralCode || ''}`;
  document.getElementById('refLinkInput').value = refLink;
  
  // Admin panel visibility
  if (d.isAdmin && d.email === ADMIN_EMAIL) {
    document.getElementById('page-admin-dashboard').style.display = 'block';
    loadAdminData();
  }
}

// ===== NAVIGATION =====
function navigate(page) {
  currentPage = page;
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Show target
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  }
  
  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  
  // Load page data
  switch(page) {
    case 'dashboard': loadDashboard(); break;
    case 'earn': loadAds(); break;
    case 'history': loadHistory(); break;
    case 'referrals': loadReferrals(); break;
    case 'notifications': loadNotifications(); break;
    case 'admin-dashboard': loadAdminData(); break;
    case 'admin-users': loadAdminUsers(); break;
    case 'admin-withdrawals': loadAdminWithdrawals(); break;
    case 'admin-ads': loadAdminAds(); break;
  }
}

// Bottom nav
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ===== DASHBOARD =====
async function loadDashboard() {
  if (!currentUser) return;
  updateUI(currentUserData);
  
  try {
    const snapshot = await transactionsRef
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const list = document.getElementById('recentList');
    const empty = document.getElementById('recentEmpty');
    
    if (snapshot.empty) {
      empty.style.display = 'block';
      list.style.display = 'none';
    } else {
      empty.style.display = 'none';
      list.style.display = 'block';
      list.innerHTML = '<div class="table-container"><table><tr><th>Type</th><th>Amount</th><th>Date</th></tr>';
      snapshot.forEach(doc => {
        const t = doc.data();
        list.innerHTML += `<tr><td>${t.type||'N/A'}</td><td style="color:${t.amount>0?'var(--green)':'var(--red)'}">${t.amount>0?'+':''}$${(t.amount||0).toFixed(2)}</td><td style="color:var(--text-muted)">${formatDate(t.createdAt)}</td></tr>`;
      });
      list.innerHTML += '</table></div>';
    }
    
    // Load referrals count
    const refSnap = await referralsRef.where('referrerId', '==', currentUser.uid).get();
    document.getElementById('statRefs').textContent = refSnap.size;
    
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ===== EARN / ADS =====
async function loadAds() {
  const grid = document.getElementById('adsGrid');
  grid.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div><div class="loading-shimmer"></div>';
  
  try {
    const snapshot = await adsRef.where('isActive', '==', true).get();
    
    if (snapshot.empty) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📺</div><h3>No ads available</h3></div>';
      return;
    }
    
    const ads = [];
    snapshot.forEach(doc => ads.push({ id: doc.id, ...doc.data() }));
    
    // Set hero ad (first one)
    if (ads.length > 0) {
      document.getElementById('earnMainTitle').textContent = ads[0].title;
      document.getElementById('earnMainReward').textContent = `Earn $${(ads[0].reward || 0).toFixed(2)}`;
      document.getElementById('earnMainTitle').dataset.adId = ads[0].id;
      document.getElementById('earnMainTitle').dataset.reward = ads[0].reward || 0.01;
    }
    
    grid.innerHTML = '';
    ads.forEach(ad => {
      const card = document.createElement('div');
      card.className = 'ad-card glass';
      card.innerHTML = `<div class="ad-icon">📺</div><h4>${ad.title}</h4><p>$${(ad.reward||0).toFixed(2)} | ${ad.duration||5}s</p>`;
      card.onclick = () => startWatchAd(ad.id, ad.reward, ad.title);
      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Load ads error:', e);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Failed to load ads</h3><p>Check your connection</p></div>';
  }
}

function watchAdNow() {
  const hero = document.getElementById('earnMainTitle');
  const id = hero.dataset.adId;
  const reward = parseFloat(hero.dataset.reward) || 0.01;
  const title = hero.textContent;
  startWatchAd(id, reward, title);
}

// Watch ad flow
let adTimer = null;
function startWatchAd(adId, reward, title) {
  const modal = document.getElementById('adModal');
  modal.classList.add('show');
  document.getElementById('adRewardText').innerHTML = `Watch to earn <strong>$${(reward||0.01).toFixed(2)}</strong>`;
  
  const btn = document.getElementById('adWatchBtn');
  const countdown = document.getElementById('adCountdown');
  const progress = document.getElementById('adProgressBar');
  
  btn.disabled = true;
  countdown.textContent = '▶';
  progress.style.width = '0%';
  
  // Try rewarded ad from network first
  if (window.earnnovaAds && typeof earnnovaAds.showRewarded === 'function') {
    btn.textContent = '📺 Loading ad...';
    earnnovaAds.showRewarded().then(watched => {
      if (watched) {
        startCountdown(adId, reward, btn, countdown, progress);
      } else {
        btn.textContent = '⏳ Ad not completed, try again';
        btn.disabled = false;
        btn.onclick = () => startWatchAd(adId, reward, title);
      }
    }).catch(() => startCountdown(adId, reward, btn, countdown, progress));
  } else {
    startCountdown(adId, reward, btn, countdown, progress);
  }
}

function startCountdown(adId, reward, btn, countdownEl, progressEl) {
  btn.textContent = '⏳ Watching...';
  let sec = 5;
  countdownEl.textContent = sec;
  
  adTimer = setInterval(() => {
    sec--;
    countdownEl.textContent = sec;
    progressEl.style.width = ((5 - sec) / 5 * 100) + '%';
    
    if (sec <= 0) {
      clearInterval(adTimer);
      btn.disabled = false;
      btn.textContent = '✅ Claim $' + (reward||0.01).toFixed(2);
      btn.onclick = () => claimAdReward(adId, reward||0.01);
    }
  }, 1000);
}

async function claimAdReward(adId, reward) {
  const btn = document.getElementById('adWatchBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Claiming...';
  
  try {
    await usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(reward),
      totalEarned: firebase.firestore.FieldValue.increment(reward),
      adsWatched: firebase.firestore.FieldValue.increment(1)
    });
    
    await transactionsRef.add({
      userId: currentUser.uid,
      type: 'Ad Reward',
      amount: reward,
      status: 'completed',
      description: 'Ad watching reward',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showToast('+$' + reward.toFixed(2) + ' earned! 🎉', 'success');
    closeAdModal();
    
    // Reload data
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) {
      currentUserData = { id: currentUser.uid, ...doc.data() };
      updateUI(currentUserData);
    }
    
    // Show notification popup
    setTimeout(() => showNotifPopup('💰 Reward!', `You earned $${reward.toFixed(2)} from watching an ad!`), 500);
  } catch (e) {
    console.error('Claim error:', e);
    showAlert('Error claiming reward', 'error');
    btn.disabled = false;
    btn.textContent = '✅ Claim Reward';
  }
}

function closeAdModal() {
  document.getElementById('adModal').classList.remove('show');
  if (adTimer) clearInterval(adTimer);
}

// ===== HISTORY =====
async function loadHistory() {
  try {
    const snapshot = await transactionsRef
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const body = document.getElementById('historyBody');
    if (snapshot.empty) {
      body.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><h3>No history yet</h3><p>Start earning in the Earn tab</p></div>';
      return;
    }
    
    let html = '<div class="table-container"><table><tr><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr>';
    snapshot.forEach(doc => {
      const t = doc.data();
      const sign = t.amount >= 0 ? '+' : '';
      const color = t.amount >= 0 ? 'var(--green)' : 'var(--red)';
      html += `<tr><td>${t.type||'N/A'}</td><td style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</td><td style="color:var(--text-muted)">${formatDate(t.createdAt)}</td><td><span style="color:var(--green)">${t.status||'completed'}</span></td></tr>`;
    });
    html += '</table></div>';
    body.innerHTML = html;
  } catch (e) {
    console.error('History error:', e);
  }
}

// ===== REFERRALS =====
async function loadReferrals() {
  try {
    const snapshot = await referralsRef.where('referrerId', '==', currentUser.uid).get();
    const body = document.getElementById('refListBody');
    const count = snapshot.size;
    
    document.getElementById('statRefs').textContent = count;
    document.getElementById('refProgressFill').style.width = Math.min(count / 10 * 100, 100) + '%';
    document.getElementById('refProgressText').textContent = `${count}/10 referrals`;
    
    if (snapshot.empty) {
      body.innerHTML = '<div class="empty-state"><p>No referrals yet. Share your link!</p></div>';
      return;
    }
    
    let html = '<div class="table-container"><table><tr><th>Name</th><th>Date</th><th>Bonus</th></tr>';
    let totalBonus = 0;
    snapshot.forEach(doc => {
      const r = doc.data();
      totalBonus += r.bonus || 0;
      html += `<tr><td>${r.referredName||'User'}</td><td style="color:var(--text-muted)">${formatDate(r.createdAt)}</td><td style="color:var(--green)">+$${(r.bonus||0).toFixed(2)}</td></tr>`;
    });
    html += '</table></div>';
    body.innerHTML = html;
  } catch (e) {
    console.error('Referrals error:', e);
  }
}

// Copy referral link
document.getElementById('copyRefBtn').addEventListener('click', () => {
  const input = document.getElementById('refLinkInput');
  input.select();
  document.execCommand('copy');
  showToast('Link copied! 📋', 'success');
});

// ===== NOTIFICATIONS =====
async function loadNotifications() {
  try {
    const userSnap = await notificationsRef.where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').limit(20).get();
    const globalSnap = await notificationsRef.where('userId', '==', 'all').orderBy('createdAt', 'desc').limit(20).get();
    
    const container = document.getElementById('notifList');
    const allNotifs = [];
    
    userSnap.forEach(doc => allNotifs.push({ id: doc.id, ...doc.data() }));
    globalSnap.forEach(doc => allNotifs.push({ id: doc.id, ...doc.data() }));
    
    allNotifs.sort((a, b) => (b.createdAt?.toDate()||0) - (a.createdAt?.toDate()||0));
    
    if (allNotifs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><h3>All caught up!</h3></div>';
      return;
    }
    
    container.innerHTML = '';
    allNotifs.slice(0, 20).forEach(n => {
      container.innerHTML += `<div class="card glass" style="padding:12px 16px;cursor:pointer"><div class="flex-between"><strong>${n.title||'Notification'}</strong><span style="font-size:0.75rem;color:var(--text-muted)">${formatDate(n.createdAt)}</span></div><p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">${n.message||''}</p></div>`;
    });
  } catch (e) {
    console.error('Notifications error:', e);
  }
}

// ===== PROFILE =====
document.getElementById('profileForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('profEditName').value.trim();
  const phone = document.getElementById('profEditPhone').value.trim();
  try {
    await usersRef.doc(currentUser.uid).update({ name, phone });
    showToast('Profile updated! ✅');
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) {
      currentUserData = { id: currentUser.uid, ...doc.data() };
      updateUI(currentUserData);
    }
  } catch (err) {
    showAlert('Error: ' + err.message);
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (confirm('Sign out?')) {
    await auth.signOut();
  }
});

// ===== WITHDRAWAL =====
document.querySelectorAll('.method-card[data-method]').forEach(card => {
  card.addEventListener('click', function() {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');
    showWithdrawForm(this.dataset.method);
  });
});

const fieldConfigs = {
  bkash: [{label:'bKash Number',name:'account',placeholder:'01XXXXXXXXX'}],
  nagad: [{label:'Nagad Number',name:'account',placeholder:'01XXXXXXXXX'}],
  binance: [{label:'Binance ID/Email',name:'account',placeholder:'your@email.com'},{label:'Network',name:'network',placeholder:'BEP20'}],
  paypal: [{label:'PayPal Email',name:'account',placeholder:'your@paypal.com'}],
  wise: [{label:'Wise Email',name:'account',placeholder:'your@wise.com'}],
  bank: [{label:'Account Name',name:'accountName'},{label:'Account Number',name:'accountNumber'},{label:'Bank Name',name:'bankName'}],
  crypto: [{label:'Wallet Address',name:'wallet'},{label:'Currency',name:'currency',placeholder:'USDT'},{label:'Network',name:'network',placeholder:'ERC20'}]
};

function showWithdrawForm(method) {
  const card = document.getElementById('wdFormCard');
  card.style.display = 'block';
  document.getElementById('wdFormTitle').textContent = `Withdraw via ${method.charAt(0).toUpperCase() + method.slice(1)}`;
  
  const fields = document.getElementById('wdFields');
  fields.innerHTML = '';
  (fieldConfigs[method] || [{label:'Details',name:'details'}]).forEach(f => {
    fields.innerHTML += `<div class="input-group"><label>${f.label}</label><input type="text" name="${f.name}" placeholder="${f.placeholder||''}" required></div>`;
  });
}

document.getElementById('wdForm').addEventListener('submit', async e => {
  e.preventDefault();
  const method = document.querySelector('.method-card.selected');
  if (!method) { showAlert('Select a method'); return; }
  
  const amount = parseFloat(document.getElementById('wdAmount').value);
  if (amount < 5) { showAlert('Minimum $5'); return; }
  if (amount > (currentUserData.balance || 0)) { showAlert('Insufficient balance'); return; }
  
  const formData = new FormData(document.getElementById('wdForm'));
  const details = {};
  formData.forEach((v, k) => details[k] = v);
  
  try {
    await withdrawalsRef.add({
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUserData.name,
      method: method.dataset.method,
      amount, details,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    await usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount),
      totalWithdrawn: firebase.firestore.FieldValue.increment(amount)
    });
    
    showToast('Withdrawal submitted! ✅');
    document.getElementById('wdFormCard').style.display = 'none';
    document.getElementById('wdAmount').value = '';
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
    
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) {
      currentUserData = { id: currentUser.uid, ...doc.data() };
      updateUI(currentUserData);
    }
  } catch (err) {
    showAlert('Error: ' + err.message);
  }
});

// ===== NOTIFICATION POPUP =====
let shownNotifs = new Set();

function showNotificationPopup() {
  // Show welcome notification on first login
  if (!shownNotifs.has('welcome')) {
    shownNotifs.add('welcome');
    setTimeout(() => {
      showNotifPopup('🎉 Welcome to EARNNOVA!', 'Start earning by watching ads in the Earn tab.');
    }, 2000);
  }
}

function showNotifPopup(title, message) {
  document.getElementById('notifPopupTitle').textContent = title;
  document.getElementById('notifPopupMessage').textContent = message;
  document.getElementById('notifModal').classList.add('show');
}

function closeNotifModal() {
  document.getElementById('notifModal').classList.remove('show');
}

// Admin notification button
document.getElementById('notifBtn').addEventListener('click', () => navigate('notifications'));

// ===== HELPERS =====
function formatDate(ts) {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
}

// Toggle balance visibility
document.getElementById('toggleBalance').addEventListener('click', () => {
  const el = document.getElementById('balanceDisplay');
  if (el.textContent === '*****') {
    el.textContent = '$' + (currentUserData?.balance || 0).toFixed(2);
  } else {
    el.dataset.orig = el.textContent;
    el.textContent = '*****';
  }
});

// Splash auto-hide
setTimeout(() => {
  if (!currentUser) {
    document.getElementById('splash').classList.add('hide');
    showPage('authPage');
  }
}, 3000);
