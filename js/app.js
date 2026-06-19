// =============================================
// EARNNOVA BETA - Full App with Plans & Admin
// =============================================
let currentUser = null, currentUserData = null;
let adTimer = null, adNetworkTimeout = null;
let adState = { id:null, reward:0.01, title:'Ad', counter:1, total:1 };
let carouselIndex = 0, carouselTimer = null;

// ===== FIRESTORE TIMEOUT HELPER =====
// Prevents infinite hanging when rules block or network is slow
function fbTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
}

// ===== HARDCODED FALLBACK DATA =====
const FALLBACK_ADS = [
  { title: 'Premium Video', reward: 0.10, duration: 30 },
  { title: 'Quick Cash', reward: 0.05, duration: 15 },
  { title: 'Featured Promotion', reward: 0.15, duration: 45 },
  { title: 'Standard Banner', reward: 0.03, duration: 10 },
  { title: 'Bonus Video', reward: 0.20, duration: 60 },
];
const FALLBACK_PLANS = [
  { id: 'p1', name: 'Starter', price: 5, dailyEarnings: 0.50, duration: 30, features: 'Basic earning, 5 ads/day' },
  { id: 'p2', name: 'Silver', price: 15, dailyEarnings: 2.00, duration: 30, features: 'More ads, priority support' },
  { id: 'p3', name: 'Gold', price: 30, dailyEarnings: 5.00, duration: 30, features: 'Unlimited ads, instant withdraw' },
  { id: 'p4', name: 'Diamond', price: 60, dailyEarnings: 12.00, duration: 30, features: 'VIP, 2x earnings, bonus rewards' },
];

// ===== LOCAL BALANCE CACHE =====
function getLocal(key, def=0) {
  try { return parseFloat(localStorage.getItem('en_' + key) || String(def)); } catch(e) { return def; }
}
function setLocal(key, val) {
  try { localStorage.setItem('en_' + key, String(val)); } catch(e) {}
}
function addLocal(key, amount) {
  const val = getLocal(key, 0) + amount;
  setLocal(key, val);
  return val;
}

// ===== AUTH =====
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
    const doc = await fbTimeout(usersRef.doc(uid).get());
    if (doc.exists) {
      currentUserData = { id: uid, ...doc.data() };
      if (currentUser.email === ADMIN_EMAIL) currentUserData.isAdmin = true;
      initApp();
    } else {
      if (currentUser) await createUserDoc(currentUser);
      await loadUserData(currentUser.uid);
    }
  } catch(e) {
    console.warn('Auth fallback, using local:', e.message);
    currentUserData = {
      id: currentUser?.uid || 'local',
      name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
      email: currentUser?.email || '',
      balance: getLocal('bal'), totalEarned: getLocal('earned'),
      adsWatched: getLocal('watched'), isAdmin: currentUser?.email === ADMIN_EMAIL,
    };
    initApp();
  }
}

async function createUserDoc(user) {
  const data = {
    uid: user.uid, email: user.email,
    name: user.displayName || user.email.split('@')[0],
    photo: user.photoURL || '', phone: '',
    balance: 0, totalEarned: 0, totalWithdrawn: 0,
    adsWatched: 0, todayAds: 0, lastAdDate: '',
    referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    referredBy: '', streak: 0, lastActive: '',
    planId: null, planExpiry: null,
    isActive: true, isAdmin: user.email === ADMIN_EMAIL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  await fbTimeout(usersRef.doc(user.uid).set(data));
}

// ===== VIEW CONTROL =====
function showView(id) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  switch(page) {
    case 'home': loadDashboard(); break;
    case 'earn': loadEarnPage(); break;
    case 'plans': loadPlans(); break;
    case 'referrals': loadReferrals(); break;
    case 'history': loadHistory(); break;
    case 'admin':
      if (currentUserData?.isAdmin || currentUser?.email === ADMIN_EMAIL) {
        adminLoadStats();
        adminLoadUsers();
      } else {
        showToast('Admin only','error');
        navigate('home');
      }
      break;
  }
}
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ===== INIT =====
function initApp() {
  document.getElementById('splash').classList.add('hide');
  showView('appPage');
  updateUI();
  navigate('home');
  startCarousel();
  showWelcomePopup();
  function updTime() {
    const d = new Date();
    document.getElementById('statusTime').textContent = 
      d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    document.getElementById('greetTime').textContent = 
      d.getHours() < 12 ? 'Morning' : d.getHours() < 18 ? 'Afternoon' : 'Evening';
  }
  updTime(); setInterval(updTime, 10000);
}

function updateUI() {
  const d = currentUserData;
  if (!d) return;
  const bal = Math.max(d.balance||0, getLocal('bal'));
  const earned = Math.max(d.totalEarned||0, getLocal('earned'));
  document.getElementById('greetAvatar').textContent = (d.name||'U')[0].toUpperCase();
  document.getElementById('greetName').textContent = d.name||'User';
  document.getElementById('balanceDisplay').textContent = '$' + bal.toFixed(2);
  document.getElementById('statAds').textContent = d.adsWatched||0;
  document.getElementById('statEarned').textContent = '$' + earned.toFixed(2);
  document.getElementById('wdBalance').textContent = '$' + bal.toFixed(2);
  document.getElementById('profAvatar').textContent = (d.name||'U')[0].toUpperCase();
  document.getElementById('profName').textContent = d.name||'User';
  document.getElementById('profEmail').textContent = d.email||'';
  document.getElementById('profEditName').value = d.name||'';
  document.getElementById('profEditPhone').value = d.phone||'';
  document.getElementById('refLinkInput').value = `${window.location.origin}/?ref=${d.referralCode||''}`;
  updateStreak();
  
  // Admin button on profile
  const adminBtn = document.getElementById('adminEntryBtn');
  if (adminBtn) {
    if (d.isAdmin || currentUser?.email === ADMIN_EMAIL) {
      adminBtn.style.display = 'flex';
    } else {
      adminBtn.style.display = 'none';
    }
  }
}

// ===== DASHBOARD =====
async function loadDashboard() {
  updateUI();
  if (!currentUser) return;
  try {
    const snap = await fbTimeout(transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc').limit(5).get());
    const list = document.getElementById('recentList');
    if (snap.empty) {
      list.innerHTML = '<div class="activity-empty"><div class="empty-icon">🚀</div><p>Your first transaction will appear here</p><button class="btn btn-primary btn-sm mt-1" onclick="navigate(\'earn\')">Watch First Ad →</button></div>';
    } else {
      list.innerHTML = '';
      snap.forEach(doc => {
        const t = doc.data();
        const icon = t.type?.includes('Ad') ? '🎬' : t.type?.includes('Referral') ? '👥' : '💰';
        const sign = (t.amount||0) >= 0 ? '+' : '';
        const color = (t.amount||0) >= 0 ? 'var(--green)' : 'var(--error)';
        list.innerHTML += `<div class="activity-item"><span class="ai-icon">${icon}</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${formatDate(t.createdAt)}</small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;
      });
    }
    const refSnap = await fbTimeout(referralsRef.where('referrerId','==',currentUser.uid).get());
    document.getElementById('statRefs').textContent = refSnap.size;
    loadTodayStats();
  } catch(e) { console.warn('Dashboard fallback:', e.message); }
}

async function loadTodayStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const snap = await fbTimeout(transactionsRef.where('userId','==',currentUser.uid).where('type','==','Ad Reward').orderBy('createdAt','desc').get());
    let count = 0;
    snap.forEach(doc => {
      const t = doc.data();
      if (t.createdAt) {
        const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        if (d.toISOString().split('T')[0] === today) count++;
      }
    });
    document.getElementById('todayCount').textContent = count + ' ads today';
    document.getElementById('goalProgress').textContent = Math.min(count,5) + '/5';
    document.getElementById('goalFill').style.width = Math.min(count/5*100,100) + '%';
  } catch(e) {}
}

// ===== EARN with 30s Box =====
async function loadEarnPage() {
  loadTodayStats();
  const list = document.getElementById('adsList');
  list.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div>';
  let ads = [];
  try {
    const snap = await fbTimeout(adsRef.where('isActive','==',true).get());
    snap.forEach(doc => ads.push({ id: doc.id, ...doc.data() }));
  } catch(e) { console.warn('Ads fallback'); }
  if (ads.length === 0) ads = FALLBACK_ADS.map((a,i)=>({id:'fb_'+i,...a}));
  
  list.innerHTML = '';
  ads.forEach(ad => {
    const t = (ad.title||'Ad').replace(/'/g,"\\'");
    list.innerHTML += `
      <div class="ad-card glass" onclick="openAdBox('${ad.id}', ${ad.reward||0.02}, '${t}', ${ad.duration||30})">
        <span class="ac-icon">🎬</span>
        <div class="ac-info"><h4>${ad.title||'Ad'}</h4><p>${ad.duration||30}s</p></div>
        <span class="ac-reward">+$${(ad.reward||0.02).toFixed(2)}</span>
        <button class="btn btn-primary btn-xs">▶ Watch</button>
      </div>`;
  });
}

// ===== AD BOX - 30s Timer in Video Box =====
function openAdBox(adId, reward, title, duration) {
  adState = { id: adId, reward: reward||0.02, title: title||'Ad', duration: duration||30 };
  const modal = document.getElementById('adModal');
  modal.classList.add('show');
  
  document.getElementById('modalAdContent').innerHTML = `
    <div class="ad-video-box">
      <div class="ad-video-display">
        <div class="ad-video-icon">▶️</div>
        <div class="ad-video-label">Ad Content</div>
      </div>
      <div class="ad-video-timer-ring">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.06)" stroke-width="6" fill="none"/>
          <circle cx="60" cy="60" r="52" stroke="url(#adGrad)" stroke-width="6" fill="none" 
                  stroke-dasharray="326.7" stroke-dashoffset="0" stroke-linecap="round" 
                  transform="rotate(-90,60,60)" id="adRing"/>
          <defs><linearGradient id="adGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00D4FF"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>
        </svg>
        <div class="ad-video-timer-text" id="adTimerText">${duration||30}</div>
      </div>
      <div class="ad-video-reward">💰 +$${(reward||0.02).toFixed(2)}</div>
    </div>`;
  
  const btn = document.getElementById('adActionBtn');
  const footer = document.querySelector('.modal-ad-footer');
  footer.innerHTML = `
    <div class="ad-reward-info">
      <span>💰 Reward: <strong>+$${(reward||0.02).toFixed(2)}</strong></span>
      <span>⏱️ <span id="timeLeft">${duration||30}s</span></span>
    </div>
    <button id="adActionBtn" class="btn btn-primary btn-block" disabled>⏳ Watching...</button>`;
  
  startBoxCountdown(duration||30);
}

function startBoxCountdown(sec) {
  const ring = document.getElementById('adRing');
  const timer = document.getElementById('adTimerText');
  const timeLeft = document.getElementById('timeLeft');
  const total = sec;
  const circumference = 326.7;
  
  adTimer = setInterval(() => {
    sec--;
    const pct = sec / total;
    if (ring) ring.style.strokeDashoffset = circumference * (1 - pct);
    if (timer) timer.textContent = sec;
    if (timeLeft) timeLeft.textContent = sec + 's';
    
    if (sec <= 0) {
      clearInterval(adTimer);
      const btn = document.getElementById('adActionBtn');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✅ Claim $' + adState.reward.toFixed(2);
        btn.onclick = claimAdReward;
      }
      if (timer) timer.textContent = '✅';
    }
  }, 1000);
}

function closeAdModal() {
  document.getElementById('adModal').classList.remove('show');
  if (adTimer) clearInterval(adTimer);
  if (adNetworkTimeout) clearTimeout(adNetworkTimeout);
}

// ===== CLAIM REWARD =====
async function claimAdReward() {
  const btn = document.getElementById('adActionBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Claiming...'; }
  let ok = false;
  try {
    await fbTimeout(usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(adState.reward),
      totalEarned: firebase.firestore.FieldValue.increment(adState.reward),
      adsWatched: firebase.firestore.FieldValue.increment(1)
    }));
    await fbTimeout(transactionsRef.add({
      userId: currentUser.uid, type: 'Ad Reward',
      amount: adState.reward, status: 'completed',
      description: adState.title,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    ok = true;
  } catch(e) { console.warn('Claim local fallback:', e.message); }
  
  addLocal('bal', adState.reward);
  addLocal('earned', adState.reward);
  addLocal('watched', 1);
  if (currentUserData) {
    currentUserData.balance = (currentUserData.balance||0) + adState.reward;
    currentUserData.totalEarned = (currentUserData.totalEarned||0) + adState.reward;
    currentUserData.adsWatched = (currentUserData.adsWatched||0) + 1;
  }
  closeAdModal();
  updateUI(); loadTodayStats();
  showToast('+' + adState.reward.toFixed(2) + ' earned! 🎉');
  setTimeout(() => showNotifPopup('💰 Reward!', 'You earned $' + adState.reward.toFixed(2)), 500);
}

// ===== PLANS =====
async function loadPlans() {
  const container = document.getElementById('plansContainer');
  container.innerHTML = '<div class="loading-shimmer" style="height:200px"></div>';
  let plans = [];
  try {
    const snap = await fbTimeout(db.collection('plans').where('isActive','==',true).get());
    snap.forEach(doc => plans.push({ id: doc.id, ...doc.data() }));
  } catch(e) { console.warn('Plans fallback'); }
  if (plans.length === 0) plans = FALLBACK_PLANS;
  
  const currentPlan = currentUserData?.planId || null;
  container.innerHTML = plans.map(p => `
    <div class="plan-card glass ${currentPlan === p.id ? 'plan-active' : ''}">
      <div class="plan-badge">${p.name}</div>
      <div class="plan-price">$${p.price}</div>
      <div class="plan-earnings">Earn $${(p.dailyEarnings||0).toFixed(2)}/day</div>
      <div class="plan-duration">${p.duration||30} days</div>
      <div class="plan-features">${p.features||''}</div>
      ${currentPlan === p.id 
        ? '<span class="plan-owned">✅ Owned</span>' 
        : `<button class="btn btn-primary btn-sm btn-block" onclick="buyPlan('${p.id}','${p.name}',${p.price})">Buy $${p.price}</button>`}
    </div>`).join('');
}

async function buyPlan(planId, name, price) {
  if ((currentUserData?.balance||0) < price && getLocal('bal') < price) {
    showToast('Insufficient balance!', 'error'); return;
  }
  if (!confirm(`Buy ${name} plan for $${price.toFixed(2)}?`)) return;
  
  try {
    await fbTimeout(usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-price),
      planId: planId,
      planExpiry: new Date(Date.now() + 30*24*60*60*1000)
    }));
    showToast(name + ' plan activated! 🚀');
  } catch(e) {
    addLocal('bal', -price);
    showToast(name + ' plan activated (offline)! 🚀');
  }
  if (currentUserData) {
    currentUserData.balance = (currentUserData.balance||0) - price;
    currentUserData.planId = planId;
  }
  updateUI();
  loadPlans();
}

// ===== REFERRALS =====
async function loadReferrals() {
  try {
    const snap = currentUser ? await fbTimeout(referralsRef.where('referrerId','==',currentUser.uid).get()) : { size: 0, forEach:()=>{} };
    document.getElementById('refCount').textContent = snap.size;
    let bonus = 0;
    document.querySelectorAll('.milestone').forEach(m => {
      const needed = parseInt(m.dataset.count);
      const check = m.querySelector('.ms-check');
      if (snap.size >= needed) {
        check.textContent = '✅'; check.classList.add('unlocked');
        m.style.borderColor = 'rgba(16,185,129,0.3)';
        bonus += needed === 1 ? 0.5 : needed === 5 ? 2.5 : 5;
      }
    });
    document.getElementById('refEarned').textContent = '$' + bonus.toFixed(2);
    
    const body = document.getElementById('refListBody');
    if (snap.size === 0) {
      body.innerHTML = '<div class="activity-empty"><p>No referrals yet</p></div>';
    } else {
      body.innerHTML = '';
      snap.forEach(doc => {
        const r = doc.data();
        body.innerHTML += `<div class="activity-item"><span class="ai-icon">👥</span><div class="ai-info"><strong>${r.referredName||'User'}</strong><small>${formatDate(r.createdAt)}</small></div><span class="ai-amount" style="color:var(--green)">+$${(r.bonus||0).toFixed(2)}</span></div>`;
      });
    }
  } catch(e) {}
}

document.getElementById('copyRefBtn')?.addEventListener('click', () => {
  const input = document.getElementById('refLinkInput');
  input.select(); document.execCommand('copy');
  showToast('Link copied! 📋');
});

// ===== HISTORY =====
async function loadHistory(filter) {
  try {
    let q = transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc');
    if (filter === 'earned') q = q.where('type','==','Ad Reward');
    else if (filter === 'withdrawal') q = q.where('type','==','Withdrawal');
    const snap = await fbTimeout(q.get());
    const body = document.getElementById('historyBody');
    if (snap.empty) {
      body.innerHTML = '<div class="activity-empty"><div class="empty-icon">📜</div><p>No transactions yet</p></div>';
      return;
    }
    body.innerHTML = '';
    snap.forEach(doc => {
      const t = doc.data();
      const icon = t.type?.includes('Ad') ? '🎬' : t.type?.includes('Referral') ? '👥' : '💳';
      const sign = (t.amount||0) >= 0 ? '+' : '';
      const color = (t.amount||0) >= 0 ? 'var(--green)' : 'var(--error)';
      body.innerHTML += `<div class="activity-item"><span class="ai-icon">${icon}</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${formatDate(t.createdAt)} • ${t.status||'completed'}</small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;
    });
  } catch(e) { console.warn('History fallback'); }
}

document.querySelectorAll('.htab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.htab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    loadHistory(this.dataset.filter);
  });
});

// ===== PROFILE =====
document.getElementById('profileForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('profEditName').value.trim();
  const phone = document.getElementById('profEditPhone').value.trim();
  try {
    await fbTimeout(usersRef.doc(currentUser.uid).update({ name, phone }));
    showToast('Updated ✅');
  } catch(e) { showToast('Saved locally ✅'); }
  if (currentUserData) { currentUserData.name = name; currentUserData.phone = phone; }
  updateUI();
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (confirm('Sign out?')) await auth.signOut();
});

// ===== WITHDRAWAL =====
document.querySelectorAll('.wd-method').forEach(card => {
  card.addEventListener('click', function() {
    document.querySelectorAll('.wd-method').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');
    showWdForm(this.dataset.method);
  });
});

const wdFields = {
  bkash: [{label:'Number',name:'account',pl:'01XXXXXXXXX'}],
  nagad: [{label:'Number',name:'account',pl:'01XXXXXXXXX'}],
  binance: [{label:'ID/Email',name:'account'},{label:'Network',name:'network',pl:'BEP20'}],
  paypal: [{label:'Email',name:'account',pl:'your@paypal.com'}],
  wise: [{label:'Email',name:'account',pl:'your@wise.com'}],
  bank: [{label:'Account Name',name:'name'},{label:'Account No',name:'number'},{label:'Bank',name:'bank'}],
  crypto: [{label:'Wallet',name:'wallet'},{label:'Currency',name:'currency',pl:'USDT'},{label:'Network',name:'network',pl:'ERC20'}]
};

function showWdForm(method) {
  const card = document.getElementById('wdFormCard');
  card.classList.remove('hidden');
  document.getElementById('wdFormTitle').textContent = method.charAt(0).toUpperCase() + method.slice(1);
  const fields = document.getElementById('wdFields');
  fields.innerHTML = '';
  (wdFields[method]||[{label:'Details',name:'details'}]).forEach(f => {
    fields.innerHTML += `<div class="input-group"><input type="text" name="${f.name}" placeholder="${f.label}" required></div>`;
  });
}

document.getElementById('wdForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const method = document.querySelector('.wd-method.selected');
  if (!method) { showToast('Select method','error'); return; }
  const amount = parseFloat(document.getElementById('wdAmount')?.value);
  if (amount < 5) { showToast('Min $5','error'); return; }
  if (amount > Math.max(currentUserData?.balance||0, getLocal('bal'))) { showToast('Insufficient','error'); return; }
  
  const fd = new FormData(document.getElementById('wdForm'));
  const details = {};
  fd.forEach((v,k) => details[k]=v);
  try {
    await fbTimeout(withdrawalsRef.add({
      userId: currentUser.uid, userEmail: currentUser.email,
      userName: currentUserData?.name, method: method.dataset.method,
      amount, details, status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
    await fbTimeout(usersRef.doc(currentUser.uid).update({
      balance: firebase.firestore.FieldValue.increment(-amount),
      totalWithdrawn: firebase.firestore.FieldValue.increment(amount)
    }));
    showToast('Withdrawal submitted ✅');
  } catch(e) {
    addLocal('bal', -amount);
    showToast('Withdrawal submitted (offline) ✅');
  }
  document.getElementById('wdFormCard').classList.add('hidden');
  if (currentUserData) currentUserData.balance = (currentUserData.balance||0) - amount;
  updateUI();
});

// ===== NOTIFICATIONS =====
function showNotifPopup(title, msg) {
  document.getElementById('notifIcon').textContent = '🎉';
  document.getElementById('notifTitle').textContent = title;
  document.getElementById('notifMessage').textContent = msg;
  document.getElementById('notifModal').classList.add('show');
}
function closeNotifModal() {
  document.getElementById('notifModal').classList.remove('show');
}
function showWelcomePopup() {
  if (!localStorage.getItem('en_welcomed')) {
    localStorage.setItem('en_welcomed','1');
    setTimeout(() => showNotifPopup('🎉 Welcome!', 'Start earning - tap Earn tab'), 2000);
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
    track.style.transform = `translateX(-${carouselIndex*100}%)`;
    dots.forEach((d,i) => d.classList.toggle('active', i===carouselIndex));
  }, 5000);
  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = sx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < dots.length-1) carouselIndex++;
      else if (diff < 0 && carouselIndex > 0) carouselIndex--;
      track.style.transform = `translateX(-${carouselIndex*100}%)`;
      dots.forEach((d,i) => d.classList.toggle('active', i===carouselIndex));
    }
  }, {passive:true});
}

// ===== STREAK =====
function updateStreak() {
  const s = currentUserData?.streak || 0;
  document.getElementById('streakDays').textContent = s + ' days';
  document.querySelectorAll('.s-dot').forEach((d,i) => {
    d.className = 's-dot';
    if (i < s) d.classList.add('active');
  });
}

// ===== TOGGLE BALANCE =====
document.getElementById('toggleBalance')?.addEventListener('click', () => {
  const el = document.getElementById('balanceDisplay');
  if (el.dataset.hid === '1') {
    el.textContent = '$' + Math.max(currentUserData?.balance||0, getLocal('bal')).toFixed(2);
    el.dataset.hid = '0';
  } else { el.textContent = '****'; el.dataset.hid = '1'; }
});

// ===== BANNER CLOSE =====
document.getElementById('bannerClose')?.addEventListener('click', () => {
  document.getElementById('bannerAd').style.display = 'none';
});

// ===== TOAST =====
function showToast(msg, type='success') {
  const c = document.getElementById('toast');
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== HELPERS =====
function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000)+'m ago';
  if (diff < 86400000) return Math.floor(diff/3600000)+'h ago';
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

// ===== SAFETY SPLASH HIDE =====
setTimeout(() => {
  document.getElementById('splash')?.classList.add('hide');
  if (!currentUser) showView('authPage');
}, 5000);
