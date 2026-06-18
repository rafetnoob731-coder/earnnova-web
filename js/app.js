// =============================================
// EARNNOVA BETA - Mobile App Framework
// =============================================
let currentUser = null, currentUserData = null;
let adTimer = null, adNetworkTimeout = null;
let adState = { id:null, reward:0.01, title:'Ad', counter:1, total:1 };
let carouselIndex = 0, carouselTimer = null;

// ===== AUTH LISTENER =====
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadUserData(user.uid);
  } else {
    currentUser = null; currentUserData = null;
    document.getElementById('splash').classList.add('hide');
    showView('authPage');
  }
});

async function loadUserData(uid) {
  try {
    const doc = await usersRef.doc(uid).get();
    if (doc.exists) {
      currentUserData = { id: uid, ...doc.data() };
      if (currentUser.email === ADMIN_EMAIL) {
        currentUserData.isAdmin = true;
        await systemConfigRef.set({ adminUids: firebase.firestore.FieldValue.arrayUnion(uid) }, { merge: true });
      }
      initApp();
    } else {
      if (currentUser) await createUserDoc(currentUser);
      await loadUserData(currentUser.uid);
    }
  } catch (e) {
    console.error('Load error:', e);
    document.getElementById('splash').classList.add('hide');
    showView('authPage');
  }
}

async function createUserDoc(user) {
  const data = {
    uid: user.uid, email: user.email,
    name: user.displayName || user.email.split('@')[0],
    photo: user.photoURL || '', phone: '',
    balance: 0, totalEarned: 0, totalWithdrawn: 0,
    adsWatched: 0, todayAds: 0, lastAdDate: '',
    referralCode: generateRefCode(), referredBy: '',
    streak: 0, lastActive: '',
    isActive: true, isAdmin: user.email === ADMIN_EMAIL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  await usersRef.doc(user.uid).set(data);
}

function generateRefCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ===== INIT =====
function initApp() {
  document.getElementById('splash').classList.add('hide');
  showView('appPage');
  updateUI();
  navigate('home');
  startCarousel();
  showWelcomePopup();
  
  // Update time
  function updateTime() {
    const d = new Date();
    document.getElementById('statusTime').textContent = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    const h = d.getHours();
    document.getElementById('greetTime').textContent = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
  }
  updateTime();
  setInterval(updateTime, 10000);
}

function updateUI() {
  const d = currentUserData;
  if (!d) return;
  
  document.getElementById('greetAvatar').textContent = (d.name||'U')[0].toUpperCase();
  document.getElementById('greetName').textContent = d.name||'User';
  document.getElementById('balanceDisplay').textContent = '$' + (d.balance||0).toFixed(2);
  document.getElementById('statAds').textContent = d.adsWatched||0;
  document.getElementById('statEarned').textContent = '$' + (d.totalEarned||0).toFixed(2);
  document.getElementById('wdBalance').textContent = '$' + (d.balance||0).toFixed(2);
  document.getElementById('profAvatar').textContent = (d.name||'U')[0].toUpperCase();
  document.getElementById('profName').textContent = d.name||'User';
  document.getElementById('profEmail').textContent = d.email||'';
  document.getElementById('profEditName').value = d.name||'';
  document.getElementById('profEditPhone').value = d.phone||'';
  
  // Referral
  const refLink = `${window.location.origin}/?ref=${d.referralCode||''}`;
  document.getElementById('refLinkInput').value = refLink;
  
  // Streak
  updateStreak();
}

// ===== VIEW CONTROL =====
function showView(id) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); }
  // Update nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  // Load data
  switch(page) {
    case 'home': loadDashboard(); break;
    case 'earn': loadEarnPage(); break;
    case 'referrals': loadReferrals(); break;
    case 'history': loadHistory(); break;
  }
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ===== DASHBOARD =====
async function loadDashboard() {
  if (!currentUser) return;
  updateUI();
  
  try {
    // Recent transactions
    const snap = await transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc').limit(5).get();
    const list = document.getElementById('recentList');
    const empty = document.getElementById('recentEmpty');
    
    if (snap.empty) {
      list.innerHTML = '<div class="activity-empty" id="recentEmpty"><div class="empty-icon">🚀</div><p>Your first transaction will appear here</p><button class="btn btn-primary btn-sm mt-1" onclick="navigate(\'earn\')">Watch First Ad →</button></div>';
    } else {
      let html = '';
      snap.forEach(doc => {
        const t = doc.data();
        const icon = t.type?.includes('Ad') ? '🎬' : t.type?.includes('Referral') ? '👥' : t.type?.includes('Withdrawal') ? '💳' : '💰';
        const sign = (t.amount||0) >= 0 ? '+' : '';
        const color = (t.amount||0) >= 0 ? 'var(--green)' : 'var(--error)';
        html += `<div class="activity-item"><span class="ai-icon">${icon}</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${formatDate(t.createdAt)}</small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;
      });
      list.innerHTML = html;
    }
    
    // Referrals count
    const refSnap = await referralsRef.where('referrerId','==',currentUser.uid).get();
    document.getElementById('statRefs').textContent = refSnap.size;
    
    // Today's ads
    loadTodayStats();
    
  } catch(e) { console.error('Dashboard:', e); }
}

async function loadTodayStats() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const snap = await transactionsRef
      .where('userId','==',currentUser.uid)
      .where('type','==','Ad Reward')
      .orderBy('createdAt','desc')
      .get();
    
    let todayCount = 0;
    snap.forEach(doc => {
      const t = doc.data();
      if (t.createdAt) {
        const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        if (d.toISOString().split('T')[0] === today) todayCount++;
      }
    });
    
    document.getElementById('todayCount').textContent = todayCount + ' ads today';
    document.getElementById('goalProgress').textContent = Math.min(todayCount,5) + '/5';
    document.getElementById('goalFill').style.width = Math.min(todayCount/5*100,100) + '%';
  } catch(e) {}
}

// ===== EARN PAGE =====
async function loadEarnPage() {
  loadTodayStats();
  
  const list = document.getElementById('adsList');
  list.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div>';
  
  try {
    let snap = await adsRef.where('isActive','==',true).get();
    
    if (snap.empty) {
      // Try auto-seeding
      list.innerHTML = '<div class="activity-empty"><div class="empty-icon">📺</div><p>No ads yet. Creating sample ads...</p></div>';
      await seedAdsIfEmpty();
      snap = await adsRef.where('isActive','==',true).get();
      if (snap.empty) {
        list.innerHTML = '<div class="activity-empty"><div class="empty-icon">📺</div><p>No ads available. Check back soon!</p></div>';
        return;
      }
    }
    
    list.innerHTML = '';
    snap.forEach(doc => {
      const ad = { id: doc.id, ...doc.data() };
      list.innerHTML += `
        <div class="ad-card glass" onclick="startWatchAd('${ad.id}', ${ad.reward||0.02}, '${ad.title.replace(/'/g,"\\'")}')">
          <span class="ac-icon">🎬</span>
          <div class="ac-info"><h4>${ad.title}</h4><p>${ad.duration||5}s • Sponsored</p></div>
          <span class="ac-reward">+$${(ad.reward||0.02).toFixed(2)}</span>
          <button class="btn btn-primary btn-xs">▶</button>
        </div>
      `;
    });
  } catch(e) {
    console.error('Earn page:', e);
    list.innerHTML = '<div class="activity-empty"><div class="empty-icon">⚠️</div><p>Could not load ads. Make sure Firestore rules allow reads.</p></div>';
  }
}

// ===== AD WATCH =====
function startWatchAd(adId, reward, title) {
  adState = { id: adId || 'quick_' + Date.now(), reward: reward || 0.02, title: title || 'Quick Ad', counter: 1, total: 1 };
  openAdModal();
}

function openAdModal() {
  const modal = document.getElementById('adModal');
  modal.classList.add('show');
  
  const s = adState;
  document.getElementById('adCounter').textContent = `Ad ${s.counter} of ${s.total}`;
  document.getElementById('adRewardLabel').textContent = '+' + (s.reward||0.02).toFixed(2);
  document.getElementById('adTimeLabel').textContent = '5s';
  document.getElementById('adTimerDisplay').textContent = '5';
  
  const ring = document.getElementById('ringFg');
  ring.style.strokeDashoffset = '283';
  
  const btn = document.getElementById('adActionBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Loading...';
  
  // Show loading
  document.getElementById('modalAdContent').innerHTML = `
    <div class="ad-player">
      <div class="ad-player-icon">▶️</div>
      <div class="ad-player-label">📺 Loading ad content...</div>
      <div class="ad-player-progress">
        <div class="ad-progress-ring" id="adProgressRing2">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" class="ring-bg"/>
            <circle cx="50" cy="50" r="45" class="ring-fg" id="ringFg2" style="stroke-dasharray:283;stroke-dashoffset:283"/>
          </svg>
          <div class="ring-text" id="adTimerDisplay2">5</div>
        </div>
      </div>
    </div>
  `;
  
  // Auto-fallback countdown after 3s
  adNetworkTimeout = setTimeout(() => startAdCountdown(), 3000);
  
  // Try ad network with race timeout
  if (window.earnnovaAds && typeof earnnovaAds.showRewarded === 'function') {
    btn.textContent = '📺 Loading ad...';
    Promise.race([
      earnnovaAds.showRewarded(),
      new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 5000))
    ]).then(watched => {
      clearTimeout(adNetworkTimeout);
      if (watched) startAdCountdown();
    }).catch(() => {});
  }
}

function startAdCountdown() {
  // Restore the countdown UI
  document.getElementById('modalAdContent').innerHTML = `
    <div class="ad-player">
      <div class="ad-player-icon">▶️</div>
      <div class="ad-player-label">📺 Ad Content</div>
      <div class="ad-player-progress">
        <div class="ad-progress-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" class="ring-bg"/>
            <circle cx="50" cy="50" r="45" class="ring-fg" id="ringFg" style="stroke-dasharray:283;stroke-dashoffset:283"/>
          </svg>
          <div class="ring-text" id="adTimerDisplay">5</div>
        </div>
      </div>
    </div>
  `;
  
  const btn = document.getElementById('adActionBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Watching...';
  
  let sec = 5;
  const totalSec = 283;
  const step = totalSec / 5;
  
  adTimer = setInterval(() => {
    sec--;
    const timerEl = document.getElementById('adTimerDisplay');
    const ringEl = document.getElementById('ringFg');
    if (timerEl) timerEl.textContent = Math.max(sec, 0);
    if (ringEl) ringEl.style.strokeDashoffset = (totalSec - ((5 - sec) * step)).toString();
    if (document.getElementById('adTimeLabel')) document.getElementById('adTimeLabel').textContent = Math.max(sec, 0) + 's';
    
    if (sec <= 0) {
      clearInterval(adTimer);
      btn.disabled = false;
      btn.textContent = '✅ Claim $' + (adState.reward||0.02).toFixed(2);
      btn.onclick = claimAdReward;
    }
  }, 1000);
}

async function claimAdReward() {
  const btn = document.getElementById('adActionBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Claiming...';
  
  try {
    await usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(adState.reward),
      totalEarned: firebase.firestore.FieldValue.increment(adState.reward),
      adsWatched: firebase.firestore.FieldValue.increment(1)
    });
    
    await transactionsRef.add({
      userId: currentUser.uid, type: 'Ad Reward',
      amount: adState.reward, status: 'completed',
      description: adState.title,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    closeAdModal();
    showToast('+' + adState.reward.toFixed(2) + ' earned! 🎉');
    
    // Refresh data
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) {
      currentUserData = { id: currentUser.uid, ...doc.data() };
      updateUI();
      loadTodayStats();
    }
    
    // Show popup
    setTimeout(() => showNotification('💰 Reward!', 'You earned $' + adState.reward.toFixed(2) + ' from watching an ad!'), 500);
  } catch(e) {
    console.error('Claim error:', e);
    showToast('Error claiming reward', 'error');
    btn.disabled = false;
    btn.textContent = 'Claim Reward';
  }
}

function closeAdModal() {
  document.getElementById('adModal').classList.remove('show');
  if (adTimer) clearInterval(adTimer);
  if (adNetworkTimeout) clearTimeout(adNetworkTimeout);
}

// ===== HISTORY =====
async function loadHistory(filter) {
  try {
    let query = transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc');
    if (filter === 'earned') query = query.where('type','==','Ad Reward');
    else if (filter === 'withdrawal') query = query.where('type','==','Withdrawal');
    
    const snap = await query.get();
    const body = document.getElementById('historyBody');
    
    if (snap.empty) {
      body.innerHTML = '<div class="activity-empty"><div class="empty-icon">📜</div><p>No transactions yet</p></div>';
      return;
    }
    
    let html = '';
    snap.forEach(doc => {
      const t = doc.data();
      const icon = t.type?.includes('Ad') ? '🎬' : t.type?.includes('Referral') ? '👥' : t.type?.includes('Withdrawal') ? '💳' : '💰';
      const sign = (t.amount||0) >= 0 ? '+' : '';
      const color = (t.amount||0) >= 0 ? 'var(--green)' : 'var(--error)';
      const statusColor = t.status === 'completed' ? 'var(--green)' : t.status === 'pending' ? 'var(--orange)' : 'var(--error)';
      html += `<div class="activity-item"><span class="ai-icon">${icon}</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${formatDate(t.createdAt)} • <span style="color:${statusColor}">${t.status||'completed'}</span></small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;
    });
    body.innerHTML = html;
  } catch(e) { console.error('History:', e); }
}

// History tabs
document.querySelectorAll('.htab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.htab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    loadHistory(this.dataset.filter);
  });
});

// ===== REFERRALS =====
async function loadReferrals() {
  try {
    const snap = await referralsRef.where('referrerId','==',currentUser.uid).get();
    const count = snap.size;
    let totalBonus = 0;
    
    document.getElementById('refCount').textContent = count;
    
    // Update milestones
    document.querySelectorAll('.milestone').forEach(m => {
      const needed = parseInt(m.dataset.count);
      const check = m.querySelector('.ms-check');
      if (count >= needed) {
        check.textContent = '✅';
        check.classList.add('unlocked');
        m.style.borderColor = 'rgba(16,185,129,0.3)';
        totalBonus += needed === 1 ? 0.5 : needed === 5 ? 2.5 : 5;
      }
    });
    document.getElementById('refEarned').textContent = '$' + totalBonus.toFixed(2);
    
    // Referral list
    const body = document.getElementById('refListBody');
    if (snap.empty) {
      body.innerHTML = '<div class="activity-empty"><p>No referrals yet. Share your link!</p></div>';
    } else {
      let html = '';
      snap.forEach(doc => {
        const r = doc.data();
        html += `<div class="activity-item"><span class="ai-icon">👥</span><div class="ai-info"><strong>${r.referredName||'User'}</strong><small>${formatDate(r.createdAt)}</small></div><span class="ai-amount" style="color:var(--green)">+$${(r.bonus||0).toFixed(2)}</span></div>`;
      });
      body.innerHTML = html;
    }
    
    document.getElementById('statRefs').textContent = count;
  } catch(e) { console.error('Referrals:', e); }
}

// Copy ref link
document.getElementById('copyRefBtn').addEventListener('click', () => {
  const input = document.getElementById('refLinkInput');
  input.select();
  document.execCommand('copy');
  showToast('Link copied! 📋');
});

function shareRef(platform) {
  const link = document.getElementById('refLinkInput').value;
  if (platform === 'copy') {
    navigator.clipboard.writeText(link).then(() => showToast('Link copied! 📋'));
  } else {
    const text = 'Join EARNNOVA and start earning! Use my referral link: ' + link;
    const url = platform === 'whatsapp' ? 'https://wa.me/?text=' + encodeURIComponent(text) :
                platform === 'instagram' ? 'https://www.instagram.com/' : '';
    if (url) window.open(url, '_blank');
  }
}

// ===== PROFILE =====
document.getElementById('profileForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('profEditName').value.trim();
  const phone = document.getElementById('profEditPhone').value.trim();
  try {
    await usersRef.doc(currentUser.uid).update({ name, phone });
    showToast('Profile updated ✅');
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) { currentUserData = { id: currentUser.uid, ...doc.data() }; updateUI(); }
  } catch(e) { showToast('Error saving', 'error'); }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (confirm('Sign out?')) await auth.signOut();
});

// ===== NOTIFICATIONS =====
function showNotification(title, message) {
  document.getElementById('notifIcon').textContent = '🎉';
  document.getElementById('notifTitle').textContent = title;
  document.getElementById('notifMessage').textContent = message;
  document.getElementById('notifModal').classList.add('show');
}

function closeNotifModal() {
  document.getElementById('notifModal').classList.remove('show');
}

function showWelcomePopup() {
  if (!localStorage.getItem('en_welcomed')) {
    localStorage.setItem('en_welcomed', '1');
    setTimeout(() => showNotification('🎉 Welcome to EARNNOVA!', 'Start earning by watching ads in the Earn tab.'), 2000);
  }
}

// ===== CAROUSEL =====
function startCarousel() {
  if (carouselTimer) clearInterval(carouselTimer);
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.dot');
  if (!track || !dots.length) return;
  
  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % dots.length;
    track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
  }, 5000);
  
  // Touch support
  let startX = 0, isDragging = false;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; });
  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < dots.length - 1) carouselIndex++;
      else if (diff < 0 && carouselIndex > 0) carouselIndex--;
      track.style.transform = `translateX(-${carouselIndex * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
    }
    isDragging = false;
  });
}

// ===== STREAK =====
function updateStreak() {
  const d = currentUserData;
  if (!d) return;
  const streak = d.streak || 0;
  document.getElementById('streakDays').textContent = streak + ' days';
  
  const dots = document.querySelectorAll('.s-dot');
  dots.forEach((dot, i) => {
    dot.className = 's-dot';
    if (i < streak) dot.classList.add('active');
    else if (i < streak + 1 && i < 7) dot.classList.add('missed');
  });
}

// ===== WITHDRAWAL =====
document.querySelectorAll('.wd-method').forEach(card => {
  card.addEventListener('click', function() {
    document.querySelectorAll('.wd-method').forEach(c => c.classList.remove('selected'));
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
  card.classList.remove('hidden');
  document.getElementById('wdFormTitle').textContent = method.charAt(0).toUpperCase() + method.slice(1);
  const fields = document.getElementById('wdFields');
  fields.innerHTML = '';
  (fieldConfigs[method]||[{label:'Details',name:'details'}]).forEach(f => {
    fields.innerHTML += `<div class="input-group"><input type="text" name="${f.name}" placeholder="${f.label}" required></div>`;
  });
}

document.getElementById('wdForm').addEventListener('submit', async e => {
  e.preventDefault();
  const method = document.querySelector('.wd-method.selected');
  if (!method) { showToast('Select a method', 'error'); return; }
  const amount = parseFloat(document.getElementById('wdAmount').value);
  if (amount < 5) { showToast('Minimum $5 withdrawal', 'error'); return; }
  if (amount > (currentUserData.balance||0)) { showToast('Insufficient balance', 'error'); return; }
  
  const formData = new FormData(document.getElementById('wdForm'));
  const details = {};
  formData.forEach((v,k) => details[k]=v);
  
  try {
    await withdrawalsRef.add({
      userId: currentUser.uid, userEmail: currentUser.email,
      userName: currentUserData.name, method: method.dataset.method,
      amount, details, status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount),
      totalWithdrawn: firebase.firestore.FieldValue.increment(amount)
    });
    showToast('Withdrawal submitted ✅');
    document.getElementById('wdFormCard').classList.add('hidden');
    document.getElementById('wdAmount').value = '';
    document.querySelectorAll('.wd-method').forEach(c => c.classList.remove('selected'));
    const doc = await usersRef.doc(currentUser.uid).get();
    if (doc.exists) { currentUserData = { id: currentUser.uid, ...doc.data() }; updateUI(); }
  } catch(err) { showToast('Error: ' + err.message, 'error'); }
});

// ===== TOGGLE BALANCE =====
document.getElementById('toggleBalance').addEventListener('click', () => {
  const el = document.getElementById('balanceDisplay');
  if (el.dataset.hidden === '1') {
    el.textContent = '$' + (currentUserData?.balance||0).toFixed(2);
    el.dataset.hidden = '0';
  } else {
    el.textContent = '****';
    el.dataset.hidden = '1';
  }
});

// ===== BANNER CLOSE =====
document.getElementById('bannerClose')?.addEventListener('click', () => {
  document.getElementById('bannerAd').style.display = 'none';
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== NOTIFICATION BUTTON =====
document.querySelector('.top-notif')?.addEventListener('click', () => navigate('notifications'));

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

// ===== HANDLE FALLBACK WHEN FIRESTORE RULES BLOCK READS =====
// This auto-detects permission errors and shows helpful messages
const originalOnError = console.error;
console.error = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
    const pages = document.querySelectorAll('.activity-empty, #adsList');
    pages.forEach(el => {
      if (el && el.innerHTML.includes('loading')) {
        el.innerHTML = '<div class="activity-empty"><div class="empty-icon">🔒</div><p>Firestore rules not configured</p><p style="font-size:12px;color:var(--text-dim)">Admin needs to paste rules in Firebase Console</p></div>';
      }
    });
  }
  originalOnError.apply(console, args);
};

// Safety: hide splash after 5s no matter what
setTimeout(() => {
  const splash = document.getElementById('splash');
  if (splash && !splash.classList.contains('hide')) {
    splash.classList.add('hide');
  }
  // If not logged in, show auth
  if (!currentUser) {
    showView('authPage');
  }
}, 5000);

// ===== AUTO-SEED ADS IF EMPTY =====
async function seedAdsIfEmpty() {
  try {
    const snap = await adsRef.limit(1).get();
    if (!snap.empty) return; // ads exist
    
    console.log('No ads found, auto-seeding...');
    const sampleAds = [
      { title: 'Premium Video Ad', reward: 0.10, duration: 30 },
      { title: 'Quick Cash Ad', reward: 0.05, duration: 15 },
      { title: 'Featured Promotion', reward: 0.15, duration: 45 },
      { title: 'Standard Banner', reward: 0.03, duration: 10 },
      { title: 'Bonus Video', reward: 0.20, duration: 60 },
      { title: 'Flash Deal', reward: 0.08, duration: 20 },
      { title: 'Partner Spotlight', reward: 0.12, duration: 35 },
    ];
    const batch = db.batch();
    sampleAds.forEach(ad => {
      const ref = adsRef.doc();
      batch.set(ref, { ...ad, isActive: true, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log('✅ Seeded ' + sampleAds.length + ' sample ads');
    if (document.getElementById('page-earn').classList.contains('active')) {
      loadEarnPage();
    }
  } catch(e) {
    console.error('Seed error:', e);
  }
}
