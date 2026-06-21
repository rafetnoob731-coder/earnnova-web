// =============================================
// EARNNOVA - Premium Dashboard
// =============================================
let currentUser = null, currentUserData = null;

// ===== MONETAG AD MANAGER =====
class EarnnovaAdManager {
  constructor() {
    this.zoneId = '11170708'; // Monetag zone ID
    this.state = 'idle'; // idle|loading|playing|completed|failed
    this.timer = null;
    this.watchStart = 0;
    this.minWatchMs = 5000;
    this.currentReward = 0.02;
    this.currentAdId = null;
    this.onReward = null;
    this.isVisible = false;
    this.visibleTime = 0;
    this.observer = null;
  }

  // ─── PLAY AD (main entry point) ───
  async play(adId, reward, title, duration, isAuto = false) {
    this.currentAdId = adId || 'ad_'+Date.now();
    this.currentReward = reward || 0.02;
    this.currentTitle = title || 'Ad';
    this.duration = duration || 30;
    this.state = 'loading';
    this.isAuto = isAuto;
    
    // Open fallback modal with countdown (ad networks disabled)
    const modal = document.getElementById('adModal');
    modal.classList.add('show');
    
    // Phase 1: Loading UI
    this.renderLoadingUI();
    await this.sleep(500); this.advanceStep(0);
    
    await this.sleep(300); this.advanceStep(1);
    
    // Phase 2: Fallback countdown ad
    this.state = 'playing';
    this.renderPlayingUI();
    this.startCountdown();
    this.trackVisibility();
    
    return new Promise((resolve) => {
      this.onReward = resolve;
    });
  }

  // Direct reward grant (when rewarded ad completes)
  async grantRewardDirect() {
    let ok = false;
    try {
      await fbTimeout(usersRef.doc(currentUser.uid).update({
        balance: firebase.firestore.FieldValue.increment(this.currentReward),
        totalEarned: firebase.firestore.FieldValue.increment(this.currentReward),
        adsWatched: firebase.firestore.FieldValue.increment(1)
      }));
      await fbTimeout(transactionsRef.add({
        userId: currentUser.uid, type: 'Ad Reward',
        amount: this.currentReward, status: 'completed',
        description: this.currentTitle + ' (rewarded)',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      ok = true;
    } catch(e) {}
    
    locAdd('bal', this.currentReward);
    locAdd('earned', this.currentReward);
    locAdd('watched', 1);
    if (currentUserData) {
      currentUserData.balance = (currentUserData.balance||0) + this.currentReward;
      currentUserData.totalEarned = (currentUserData.totalEarned||0) + this.currentReward;
      currentUserData.adsWatched = (currentUserData.adsWatched||0) + 1;
    }
    incrementDailyAdCount(); // track daily limit
    startCooldown(); // 10-min cooldown
    updateUI();
    todayStats();
    loadEarnPage();
    showToast('+$' + this.currentReward.toFixed(2) + ' earned! 🎉');
    if (this.onReward) this.onReward({ amount: this.currentReward });
    setTimeout(() => showNotif('💰 Reward!', 'You earned $' + this.currentReward.toFixed(2), '💰'), 500);
  }

  renderLoadingUI() {
    document.getElementById('modalAdContent').innerHTML = `
      <div class="ad-player-box">
        <div class="ad-player-screen">
          <div class="ad-player-icon">📺</div>
          <div class="ad-player-label">Initializing...</div>
        </div>
        <div class="ad-progress-steps" id="adSteps">
          <div class="ad-step active"></div>
          <div class="ad-step"></div>
          <div class="ad-step"></div>
        </div>
        <div class="ad-ring-wrap">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ag)" stroke-width="6" stroke-dasharray="264" stroke-dashoffset="264" stroke-linecap="round" transform="rotate(-90,50,50)" id="adRing"/>
            <defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10B981"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
          </svg>
          <div class="ad-ring-text" id="adTimerDisplay">${this.duration}</div>
        </div>
        <div class="ad-reward-big">💰 +$${this.currentReward.toFixed(2)}</div>
      </div>`;
    
    document.getElementById('modalAdFooter').innerHTML = `
      <div class="ad-reward-info"><span>💰 Reward: <strong>+$${this.currentReward.toFixed(2)}</strong></span><span>⏱️ <span id="timeLeft">0s</span></span></div>
      <button id="adActionBtn" class="btn btn-primary btn-block" disabled>⏳ Loading ad...</button>`;
  }

  advanceStep(idx) {
    const steps = document.querySelectorAll('.ad-step');
    const labels = ['Loading SDK...', 'Fetching ad...', 'Starting...'];
    if (steps[idx]) { steps[idx].classList.add('done'); steps[idx].classList.remove('active'); }
    if (steps[idx+1]) steps[idx+1].classList.add('active');
    const label = document.querySelector('.ad-player-label');
    if (label && labels[idx+1]) label.textContent = labels[idx+1];
  }

  renderPlayingUI() {
    const screen = document.querySelector('.ad-player-screen');
    if (screen) {
      screen.innerHTML = `<div class="ad-player-icon">▶️</div><div class="ad-player-label">Ad Playing</div>`;
    }
    const btn = document.getElementById('adActionBtn');
    if (btn) { btn.disabled = false; btn.textContent = '⏳ Watching...'; }
  }

  startCountdown() {
    let sec = this.duration;
    const ring = document.getElementById('adRing');
    const timer = document.getElementById('adTimerDisplay');
    const timeLeft = document.getElementById('timeLeft');
    const btn = document.getElementById('adActionBtn');
    const circ = 264;
    this.watchStart = Date.now();
    
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      sec--;
      const p = sec / this.duration;
      if (ring) ring.style.strokeDashoffset = circ * (1 - p);
      if (timer) timer.textContent = Math.max(sec, 0);
      if (timeLeft) timeLeft.textContent = Math.max(sec, 0) + 's';
      
      if (sec <= 0) {
        clearInterval(this.timer);
        this.state = 'completed';
        if (timer) timer.textContent = '✅';
        if (btn) { btn.disabled = false; btn.textContent = '✅ Claim $' + this.currentReward.toFixed(2); btn.onclick = () => this.claim(); }
        if (timeLeft) timeLeft.textContent = 'Done!';
      }
    }, 1000);
  }

  trackVisibility() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          this.isVisible = true;
        } else {
          this.isVisible = false;
        }
      });
    }, { threshold: [0.5] });
    const el = document.querySelector('.ad-player-screen');
    if (el) this.observer.observe(el);
  }

  async claim() {
    const btn = document.getElementById('adActionBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Claiming...'; }
    
    const elapsed = Date.now() - this.watchStart;
    const visPct = this.isVisible ? 1.0 : 0.8; // if not tracked, assume good
    
    if (elapsed < this.minWatchMs || visPct < 0.5) {
      showToast('Ad too short, try again', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
      return;
    }
    
    // Grant reward (Firestore + local)
    let ok = false;
    try {
      await fbTimeout(usersRef.doc(currentUser.uid).update({
        balance: firebase.firestore.FieldValue.increment(this.currentReward),
        totalEarned: firebase.firestore.FieldValue.increment(this.currentReward),
        adsWatched: firebase.firestore.FieldValue.increment(1)
      }));
      await fbTimeout(transactionsRef.add({
        userId: currentUser.uid, type: 'Ad Reward',
        amount: this.currentReward, status: 'completed',
        description: this.currentTitle,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      ok = true;
    } catch(e) {}
    
    locAdd('bal', this.currentReward);
    locAdd('earned', this.currentReward);
    locAdd('watched', 1);
    if (currentUserData) {
      currentUserData.balance = (currentUserData.balance||0) + this.currentReward;
      currentUserData.totalEarned = (currentUserData.totalEarned||0) + this.currentReward;
      currentUserData.adsWatched = (currentUserData.adsWatched||0) + 1;
    }
    incrementDailyAdCount(); // track daily limit
    
    this.close();
    startCooldown(); // 10-min cooldown
    updateUI();
    todayStats();
    loadEarnPage(); // refresh earn page to show cooldown
    showToast('+$' + this.currentReward.toFixed(2) + ' earned! 🎉');
    
    if (this.onReward) this.onReward({ amount: this.currentReward });
    setTimeout(() => showNotif('💰 Reward!', 'You earned $' + this.currentReward.toFixed(2), '💰'), 500);
  }

  close() {
    document.getElementById('adModal').classList.remove('show');
    if (this.timer) clearInterval(this.timer);
    if (this.observer) this.observer.disconnect();
    this.state = 'idle';
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

const adManager = new EarnnovaAdManager();

// ===== COOLDOWN SYSTEM (10 min between ads) =====
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
function getCooldownEnd() {
  try { return parseInt(localStorage.getItem('en_cd_end')||'0'); } catch(e) { return 0; }
}
function setCooldownEnd(ts) {
  try { localStorage.setItem('en_cd_end', String(ts)); } catch(e) {}
}
function isCooldownActive() {
  return Date.now() < getCooldownEnd();
}
function getCooldownRemaining() {
  return Math.max(0, getCooldownEnd() - Date.now());
}
function startCooldown() {
  setCooldownEnd(Date.now() + COOLDOWN_MS);
}
function updateCooldownUI() {
  const el = document.getElementById('cooldownTimer');
  if (!el) return;
  if (isCooldownActive()) {
    const rem = getCooldownRemaining();
    const min = Math.floor(rem / 60000);
    const sec = Math.floor((rem % 60000) / 1000);
    el.textContent = min + ':' + (''+sec).padStart(2,'0');
  } else {
    el.textContent = 'Ready!';
  }
}
function renderCooldown() {
  const list = document.getElementById('adsGrid');
  if (!list) return;
  const rem = getCooldownRemaining();
  const min = Math.floor(rem / 60000);
  const sec = Math.floor((rem % 60000) / 1000);
  list.innerHTML = '<div class="cooldown-card"><div class="cooldown-icon">⏳</div><div class="cooldown-label">Next ad available in</div><div class="cooldown-timer" id="cooldownTimer">'+min+':'+(''+sec).padStart(2,'0')+'</div><div class="cooldown-sub">Come back after the timer</div></div>';
  // Live countdown
  if (window._cdInterval) clearInterval(window._cdInterval);
  window._cdInterval = setInterval(() => {
    if (!isCooldownActive()) {
      clearInterval(window._cdInterval);
      loadEarnPage();
      return;
    }
    updateCooldownUI();
  }, 1000);
}

// ===== DAILY AD LIMIT (anti-spam) =====
const DAILY_AD_LIMIT = 30; // max ads per day per user
function getDailyAdCount() {
  const today = new Date().toISOString().split('T')[0];
  if (currentUserData?.lastAdDate === today && currentUserData?.todayAds) {
    return currentUserData.todayAds;
  }
  // Reset if date changed
  if (currentUserData && currentUserData.lastAdDate !== today) {
    currentUserData.lastAdDate = today;
    currentUserData.todayAds = 0;
    // Try to reset on Firestore too
    try { usersRef.doc(currentUser.uid).update({ todayAds: 0, lastAdDate: today }); } catch(e) {}
  }
  return 0;
}
function incrementDailyAdCount() {
  if (!currentUserData) return;
  const today = new Date().toISOString().split('T')[0];
  currentUserData.lastAdDate = today;
  currentUserData.todayAds = (currentUserData.todayAds || 0) + 1;
  try { usersRef.doc(currentUser.uid).update({ todayAds: firebase.firestore.FieldValue.increment(1), lastAdDate: today }); } catch(e) {}
}
function isDailyLimitReached() {
  return getDailyAdCount() >= DAILY_AD_LIMIT;
}
function getRemainingDailyAds() {
  return Math.max(0, DAILY_AD_LIMIT - getDailyAdCount());
}

// ===== FIRESTORE TIMEOUT =====
function fbTimeout(promise, ms = 5000) {
  return Promise.race([promise, new Promise((_,r)=>setTimeout(()=>r(new Error('TIMEOUT')),ms))]);
}

// ===== FALLBACK DATA =====
const FALLBACK_ADS = [
  {
    id: 'fb_001',
    title: 'Premium Wireless Earbuds',
    description: 'Studio sound, 24hr battery. Limited offer.',
    cta: 'Shop Now',
    image: 'https://placehold.co/600x400/4F46E5/FFFFFF?text=Wireless+Earbuds',
    bgColor: '#4F46E5',
    textColor: '#FFFFFF',
    tileSize: 'medium',
    reward: 0.10, duration: 30
  },
  {
    id: 'fb_002',
    title: 'Daily Skincare Routine',
    description: 'Natural, cruelty-free. 20% off first order.',
    cta: 'Learn More',
    image: 'https://placehold.co/600x400/0EA5E9/FFFFFF?text=Skincare+Set',
    bgColor: '#0EA5E9',
    textColor: '#FFFFFF',
    tileSize: 'medium',
    reward: 0.05, duration: 15
  },
  {
    id: 'fb_003',
    title: 'Home Workout Gear',
    description: 'Comfort meets performance. Free shipping.',
    cta: 'Get Offer',
    image: 'https://placehold.co/600x400/22C55E/FFFFFF?text=Workout+Essentials',
    bgColor: '#22C55E',
    textColor: '#FFFFFF',
    tileSize: 'small',
    reward: 0.03, duration: 10
  },
  {
    id: 'fb_004',
    title: 'Learn a New Skill Today',
    description: 'Thousands of courses. Start free trial.',
    cta: 'Start Now',
    image: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Online+Courses',
    bgColor: '#F59E0B',
    textColor: '#FFFFFF',
    tileSize: 'large',
    reward: 0.15, duration: 45
  },
  {
    id: 'fb_005',
    title: 'Eco-Friendly Water Bottle',
    description: 'BPA-free, keeps cold 24h. 15% off.',
    cta: 'Shop Now',
    image: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Eco+Bottle',
    bgColor: '#8B5CF6',
    textColor: '#FFFFFF',
    tileSize: 'medium',
    reward: 0.08, duration: 20
  }
];
// Render a fallback ad into any container (banner or tile)
function renderFallbackAd(ad, slot) {
  const isBanner = slot === 'banner';
  return '<div class="fallback-ad" style="background:'+ad.bgColor+';color:'+ad.textColor+';padding:16px;border-radius:12px;display:flex;align-items:center;gap:16px;'+(isBanner?'width:100%;':'max-width:300px;')+'">'
    +'<img src="'+ad.image+'" alt="'+ad.title+'" style="width:'+(isBanner?'80px':'100px')+';height:auto;border-radius:8px;">'
    +'<div>'
    +'<h4 style="margin:0;font-size:'+(isBanner?'16px':'14px')+'">'+ad.title+'</h4>'
    +'<p style="margin:4px 0;font-size:13px;opacity:0.9">'+ad.description+'</p>'
    +'<button style="background:#FFFFFF;color:'+ad.bgColor+';border:none;padding:6px 16px;border-radius:20px;font-weight:bold;cursor:pointer" onclick="openAd(\''+ad.id+'\','+(ad.reward||0.02)+',\''+ad.title+'\','+(ad.duration||30)+')">'+ad.cta+'</button>'
    +'</div></div>';
}

const FALLBACK_PLANS = [
  {name:'Starter',price:5,dailyEarnings:0.50,duration:30,features:'Basic earning'},
  {name:'Silver',price:15,dailyEarnings:2.00,duration:30,features:'More ads'},
  {name:'Gold',price:30,dailyEarnings:5.00,duration:30,features:'Unlimited ads'},
  {name:'Diamond',price:60,dailyEarnings:12.00,duration:30,features:'VIP rewards'},
];

// ===== LOCAL CACHE =====
function loc(key,def=0) { try{return parseFloat(localStorage.getItem('en_'+key)||String(def))}catch(e){return def} }
function locSet(key,val) { try{localStorage.setItem('en_'+key,String(val))}catch(e){} }
function locAdd(key,amt) { const v=loc(key,0)+amt; locSet(key,v); return v; }

// ===== AUTH =====
auth.onAuthStateChanged(user => {
  if (user) { currentUser=user; loadUserData(user.uid); }
  else { currentUser=null; currentUserData=null; document.getElementById('splash').classList.add('hide'); showView('authPage'); }
});

async function loadUserData(uid) {
  try {
    const doc=await fbTimeout(usersRef.doc(uid).get());
    if (doc.exists) { currentUserData={id:uid,...doc.data()}; if(currentUser.email===ADMIN_EMAIL) currentUserData.isAdmin=true; initApp(); }
    else { if(currentUser) await createUserDoc(currentUser); await loadUserData(currentUser.uid); }
  } catch(e) {
    currentUserData={id:currentUser?.uid||'local',name:currentUser?.displayName||currentUser?.email?.split('@')[0]||'User',email:currentUser?.email||'',balance:loc('bal'),totalEarned:loc('earned'),adsWatched:loc('watched'),isAdmin:currentUser?.email===ADMIN_EMAIL};
    initApp();
  }
}
async function createUserDoc(user) {
  await fbTimeout(usersRef.doc(user.uid).set({
    uid:user.uid,email:user.email,name:user.displayName||user.email.split('@')[0],photo:user.photoURL||'',phone:'',
    balance:0,totalEarned:0,totalWithdrawn:0,adsWatched:0,todayAds:0,lastAdDate:'',
    referralCode:Math.random().toString(36).substring(2,10).toUpperCase(),referredBy:'',
    streak:0,lastActive:'',planId:null,planExpiry:null,
    isActive:true,isAdmin:user.email===ADMIN_EMAIL,
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),lastLogin:firebase.firestore.FieldValue.serverTimestamp()
  }));
}

// ===== VIEW =====
function showView(id) { document.querySelectorAll('.page-view').forEach(p=>p.classList.add('hidden')); document.getElementById(id)?.classList.remove('hidden'); }

function navigate(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page)?.classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(i=>i.classList.toggle('active',i.dataset.page===page));
  switch(page) {
    case'home': loadDashboard(); break;
    case'earn': loadEarnPage(); break;
    case'plans': loadPlans(); break;
    case'referrals': loadReferrals(); break;
    case'history': loadHistory(page); break;
    case'admin':
      if(currentUserData?.isAdmin||currentUser?.email===ADMIN_EMAIL) { adminLoadStats(); adminLoadUsers(); }
      else { showToast('Admin only','error'); navigate('home'); }
      break;
  }
}
document.querySelectorAll('.nav-item[data-page]').forEach(i=>i.addEventListener('click',()=>navigate(i.dataset.page)));

// ===== BLOCK / SUSPENSION SYSTEM =====
function getBlockInfo() {
  try {
    const b = JSON.parse(localStorage.getItem('en_block') || '{}');
    if (!b.until || Date.now() >= b.until) { localStorage.removeItem('en_block'); return null; }
    return b;
  } catch(e) { return null; }
}
function setBlock(days, reason) {
  const until = Date.now() + days * 86400000;
  try { localStorage.setItem('en_block', JSON.stringify({ until, reason, start: Date.now() })); } catch(e) {}
}
function clearBlock() {
  try { localStorage.removeItem('en_block'); } catch(e) {}
}

// ===== INIT =====
function initApp() {
  // Check if account is blocked
  const block = getBlockInfo();
  if (block) {
    document.getElementById('splash').classList.add('hide');
    document.getElementById('appPage').classList.add('hidden');
    document.getElementById('authPage').classList.add('hidden');
    const rem = block.until - Date.now();
    const d = Math.floor(rem / 86400000);
    const h = Math.floor((rem % 86400000) / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    document.getElementById('blockPage').classList.remove('hidden');
    document.getElementById('blockReason').textContent = block.reason || 'Policy violation';
    document.getElementById('blockTimer').textContent = d + 'd ' + h + 'h ' + m + 'm';
    
    // Live countdown
    if (window._blockInt) clearInterval(window._blockInt);
    window._blockInt = setInterval(() => {
      const b = getBlockInfo();
      if (!b) {
        clearInterval(window._blockInt);
        location.reload();
        return;
      }
      const r = b.until - Date.now();
      document.getElementById('blockTimer').textContent = 
        Math.floor(r / 86400000) + 'd ' +
        Math.floor((r % 86400000) / 3600000) + 'h ' +
        Math.floor((r % 3600000) / 60000) + 'm';
    }, 10000);
    return;
  }
  
  document.getElementById('splash').classList.add('hide');
  showView('appPage');
  updateUI(); navigate('home');
  startCarousel();
  if(!localStorage.getItem('en_welcomed')) { localStorage.setItem('en_welcomed','1'); setTimeout(()=>showNotif('🎉 Welcome!','Tap Earn to start earning!','🎉'),2000); }
  function t() { const d=new Date(); document.getElementById('statusTime').textContent=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); document.getElementById('greetTime').textContent=d.getHours()<12?'Morning':d.getHours()<18?'Afternoon':'Evening'; }
  t(); setInterval(t,10000);
}

function updateUI() {
  const d=currentUserData; if(!d) return;
  const bal=Math.max(d.balance||0,loc('bal'));
  const earned=Math.max(d.totalEarned||0,loc('earned'));
  document.getElementById('greetAvatar').textContent=(d.name||'U')[0].toUpperCase();
  document.getElementById('greetName').textContent=d.name||'User';
  document.getElementById('balanceDisplay').textContent='$'+bal.toFixed(2);
  document.getElementById('statAds').textContent=d.adsWatched||0;
  document.getElementById('statEarned').textContent='$'+earned.toFixed(2);
  document.getElementById('wdBalance').textContent='$'+bal.toFixed(2);
  document.getElementById('profAvatar').textContent=(d.name||'U')[0].toUpperCase();
  document.getElementById('profName').textContent=d.name||'User';
  document.getElementById('profEmail').textContent=d.email||'';
  document.getElementById('profEditName').value=d.name||'';
  document.getElementById('profEditPhone').value=d.phone||'';
  document.getElementById('refLinkInput').value=`${window.location.origin}/?ref=${d.referralCode||''}`;
  const ab=document.getElementById('adminEntryBtn');
  if(ab) ab.style.display=(d.isAdmin||currentUser?.email===ADMIN_EMAIL)?'flex':'none';
}

// ===== DASHBOARD =====
async function loadDashboard() {
  updateUI(); if(!currentUser) return;
  try {
    const s=await fbTimeout(transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc').limit(5).get());
    const list=document.getElementById('recentList');
    if(s.empty) list.innerHTML='<div class="empty-state"><div class="empty-icon">🚀</div><p>Start earning!</p><button class="btn btn-primary btn-sm mt-1" onclick="navigate(\'earn\')">Watch First Ad →</button></div>';
    else {
      list.innerHTML='';
      s.forEach(d=>{const t=d.data();const sign=(t.amount||0)>=0?'+':'';const color=(t.amount||0)>=0?'var(--emerald)':'var(--red)';list.innerHTML+=`<div class="activity-item"><span class="ai-icon">🎬</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${fmtDate(t.createdAt)}</small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;});
    }
    const r=await fbTimeout(referralsRef.where('referrerId','==',currentUser.uid).get());
    document.getElementById('statRefs').textContent=r.size;
    todayStats();
  } catch(e){}
}

async function todayStats() {
  try {
    const s=await fbTimeout(transactionsRef.where('userId','==',currentUser.uid).where('type','==','Ad Reward').orderBy('createdAt','desc').get());
    const today=new Date().toISOString().split('T')[0]; let c=0;
    s.forEach(d=>{const t=d.data();if(t.createdAt){const dt=t.createdAt.toDate?t.createdAt.toDate():new Date(t.createdAt);if(dt.toISOString().split('T')[0]===today)c++;}});
    document.getElementById('goalCount').textContent=Math.min(c,5)+'/5';
    document.getElementById('goalFill').style.width=Math.min(c/5*100,100)+'%';
  } catch(e){}
}

// ===== EARN =====
function loadEarnPage() {
  todayStats();
  updateCooldownUI();
  // Update daily limit display
  const remAds = getRemainingDailyAds();
  const limitEl = document.getElementById('dailyLimitDisplay');
  if (limitEl) {
    limitEl.textContent = remAds + '/' + DAILY_AD_LIMIT;
    limitEl.style.color = remAds <= 5 ? 'var(--amber)' : remAds <= 0 ? 'var(--red)' : 'var(--emerald)';
  }
  if (isDailyLimitReached()) {
    const list = document.getElementById('adsGrid');
    if (list) list.innerHTML = '<div class="cooldown-card"><div class="cooldown-icon">📊</div><div class="cooldown-label">Daily limit reached</div><div class="cooldown-sub">You\'ve watched ' + DAILY_AD_LIMIT + ' ads today. Come back tomorrow!</div></div>';
    updateCooldownUI();
    return;
  }
  if (isCooldownActive()) {
    renderCooldown();
    return;
  }
  renderAds(FALLBACK_ADS);
  loadFirestoreAds();
  // Update today count badge
  document.getElementById('todayCount').textContent = getRemainingDailyAds() + '/' + DAILY_AD_LIMIT + ' today';
  // Auto-show interstitial ad after 5s (only if under daily limit)
  if (!sessionStorage.getItem('en_ad_shown') && !isDailyLimitReached()) {
    sessionStorage.setItem('en_ad_shown', '1');
    setTimeout(() => {
      adManager.currentReward = 0.02;
      adManager.currentTitle = 'Auto Interstitial';
      adManager.currentAdId = 'auto_'+Date.now();
      adManager.state = 'loading';
      const modal = document.getElementById('adModal');
      modal.classList.add('show');
      adManager.renderLoadingUI();
      setTimeout(() => {
        adManager.state = 'playing';
        adManager.renderPlayingUI();
        adManager.startCountdown();
        adManager.trackVisibility();
      }, 1600);
    }, 5000);
  }
}
function renderAds(ads) {
  const list=document.getElementById('adsGrid'); if(!list) return;
  list.innerHTML='';
  ads.forEach(a=>{
    const t=(a.title||'Ad').replace(/'/g,"\\'");
    const bg = a.bgColor || 'var(--navy-800)';
    const txt = a.textColor || '#fff';
    const img = a.image || '';
    const desc = a.description || (a.duration||30)+'s watch';
    list.innerHTML+=`<div class="ad-tile" onclick="openAd('${a.id}',${a.reward||0.02},'${t}',${a.duration||30})" style="background:${bg};color:${txt};position:relative;overflow:hidden;">
      ${img ? `<div class="ad-tile-img" style="background-image:url('${img}')"></div>` : `<span class="ad-tile-icon">🎬</span>`}
      <div class="ad-tile-info">
        <h4>${a.title||'Ad'}</h4>
        <p style="opacity:0.85;font-size:12px">${desc}</p>
        <div class="ad-tile-cta">${a.cta||'Watch'} · <strong>+$${(a.reward||0.02).toFixed(2)}</strong></div>
      </div>
      ${!img ? `<span class="ad-tile-reward">+$${(a.reward||0.02).toFixed(2)}</span>` : ''}
    </div>`;
  });
}
async function loadFirestoreAds() {
  try {
    const s=await fbTimeout(adsRef.where('isActive','==',true).get()); const ads=[];
    s.forEach(d=>ads.push({id:d.id,...d.data()}));
    if(ads.length>0) renderAds(ads);
  } catch(e){}
}

// ===== OPEN AD (uses AdManager) =====
function openAd(id, reward, title, duration) {
  if (isDailyLimitReached()) {
    showToast('Daily limit reached ('+DAILY_AD_LIMIT+' ads). Come back tomorrow!', 'error');
    return;
  }
  if (isCooldownActive()) {
    const rem = getCooldownRemaining();
    const min = Math.floor(rem / 60000);
    const sec = Math.floor((rem % 60000) / 1000);
    showToast('Wait '+min+':'+(''+sec).padStart(2,'0')+' for next ad', 'error');
    return;
  }
  // Human verification step
  window._pendingAd = { id, reward, title, duration };
  showVerification();
}

// ===== HUMAN VERIFICATION =====
function showVerification() {
  const modal = document.getElementById('verifyModal');
  if (modal) {
    modal.classList.add('show');
    // Simple math challenge
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    window._verifyAnswer = a + b;
    document.getElementById('verifyQuestion').textContent = 'What is ' + a + ' + ' + b + '?';
    document.getElementById('verifyInput').value = '';
    document.getElementById('verifyInput').focus();
    document.getElementById('verifyError').style.display = 'none';
  }
}
function submitVerification() {
  const input = document.getElementById('verifyInput');
  const val = parseInt(input.value);
  if (val === window._verifyAnswer) {
    document.getElementById('verifyModal').classList.remove('show');
    const ad = window._pendingAd;
    if (ad) {
      window.openAdId = ad.id;
      adManager.play(ad.id, ad.reward, ad.title, ad.duration).catch(() => {});
    }
  } else {
    document.getElementById('verifyError').style.display = 'block';
    input.value = '';
    input.focus();
  }
}
function closeVerification() {
  document.getElementById('verifyModal').classList.remove('show');
  window._pendingAd = null;
}
// Enter key submits verification
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('verifyModal').classList.contains('show')) {
    e.preventDefault();
    submitVerification();
  }
});
function closeAdModal() { adManager.close(); }

// ===== PLANS =====
async function loadPlans() {
  const c=document.getElementById('plansContainer'); c.innerHTML='<div class="skeleton"></div><div class="skeleton mt-1"></div>';
  let plans=[];
  try{const s=await fbTimeout(db.collection('plans').where('isActive','==',true).get());s.forEach(d=>plans.push({id:d.id,...d.data()}));}catch(e){}
  if(plans.length===0) plans=FALLBACK_PLANS;
  const cp=currentUserData?.planId;
  c.innerHTML=plans.map(p=>`
    <div class="plan-card ${cp===p.id?'plan-active':''}">
      <div class="plan-badge">${p.name}</div>
      <div class="plan-price">$${p.price}</div>
      <div class="plan-earnings">Earn $${(p.dailyEarnings||0).toFixed(2)}/day</div>
      <div class="plan-duration">${p.duration||30} days</div>
      ${p.features?`<div style="font-size:12px;color:var(--slate-500);margin-bottom:12px">${p.features}</div>`:''}
      ${cp===p.id?'<span class="plan-owned">✅ Active</span>':`<button class="btn btn-primary btn-sm btn-block" onclick="buyPlan('${p.id}','${p.name}',${p.price})">Buy $${p.price}</button>`}
    </div>`).join('');
}
async function buyPlan(id,name,price) {
  if(Math.max(currentUserData?.balance||0,loc('bal'))<price){showToast('Insufficient balance','error');return;}
  if(!confirm(`Buy ${name} for $${price}?`))return;
  try{await fbTimeout(usersRef.doc(currentUser.uid).update({balance:firebase.firestore.FieldValue.increment(-price),planId:id,planExpiry:new Date(Date.now()+30*86400000)}));showToast(name+' activated! 🚀');}catch(e){locAdd('bal',-price);showToast('Activated (offline)!');}
  if(currentUserData){currentUserData.balance=(currentUserData.balance||0)-price;currentUserData.planId=id;}
  updateUI();loadPlans();
}

// ===== REFERRALS =====
async function loadReferrals() {
  try {
    const s=currentUser?await fbTimeout(referralsRef.where('referrerId','==',currentUser.uid).get()):{size:0,forEach:()=>{}};
    document.getElementById('refCount').textContent=s.size;
    let b=0;
    document.querySelectorAll('.milestone').forEach(m=>{const n=parseInt(m.dataset.count);const ck=m.querySelector('.ms-check');if(s.size>=n){ck.textContent='✅';ck.classList.add('unlocked');b+=n===1?.5:n===5?2.5:5;}});
    document.getElementById('refEarned').textContent='$'+b.toFixed(2);
    const body=document.getElementById('refListBody');
    if(s.size===0) body.innerHTML='<div class="empty-state"><p>No referrals yet</p></div>';
    else {body.innerHTML='';s.forEach(d=>{const r=d.data();body.innerHTML+=`<div class="activity-item"><span class="ai-icon">👥</span><div class="ai-info"><strong>${r.referredName||'User'}</strong><small>${fmtDate(r.createdAt)}</small></div><span class="ai-amount" style="color:var(--emerald)">+$${(r.bonus||0).toFixed(2)}</span></div>`;});}
  } catch(e){}
}
document.getElementById('copyRefBtn')?.addEventListener('click',()=>{const i=document.getElementById('refLinkInput');i.select();document.execCommand('copy');showToast('Copied! 📋');});

// ===== HISTORY =====
async function loadHistory(f) {
  try {
    let q=transactionsRef.where('userId','==',currentUser.uid).orderBy('createdAt','desc');
    if(f==='earned') q=q.where('type','==','Ad Reward'); else if(f==='withdrawal') q=q.where('type','==','Withdrawal');
    const s=await fbTimeout(q.get()); const body=document.getElementById('historyBody');
    if(s.empty){body.innerHTML='<div class="empty-state"><div class="empty-icon">📜</div><p>No transactions</p></div>';return;}
    body.innerHTML='';
    s.forEach(d=>{const t=d.data();const sign=(t.amount||0)>=0?'+':'';const color=(t.amount||0)>=0?'var(--emerald)':'var(--red)';body.innerHTML+=`<div class="activity-item"><span class="ai-icon">🎬</span><div class="ai-info"><strong>${t.type||'Transaction'}</strong><small>${fmtDate(t.createdAt)} • ${t.status||'completed'}</small></div><span class="ai-amount" style="color:${color}">${sign}$${Math.abs(t.amount||0).toFixed(2)}</span></div>`;});
  } catch(e){}
}
document.querySelectorAll('.htab').forEach(t=>t.addEventListener('click',function(){document.querySelectorAll('.htab').forEach(x=>x.classList.remove('active'));this.classList.add('active');loadHistory(this.dataset.filter);}));

// ===== PROFILE =====
document.getElementById('profileForm')?.addEventListener('submit',async e=>{e.preventDefault();const n=document.getElementById('profEditName').value.trim(),p=document.getElementById('profEditPhone').value.trim();try{await fbTimeout(usersRef.doc(currentUser.uid).update({name:n,phone:p}));showToast('Updated ✅');}catch(e){showToast('Saved locally');}if(currentUserData){currentUserData.name=n;currentUserData.phone=p;}updateUI();});
document.getElementById('logoutBtn')?.addEventListener('click',async()=>{if(confirm('Sign out?'))await auth.signOut();});

// ===== WITHDRAW =====
document.querySelectorAll('.wd-method').forEach(c=>c.addEventListener('click',function(){document.querySelectorAll('.wd-method').forEach(x=>x.classList.remove('selected'));this.classList.add('selected');showWdForm(this.dataset.method);}));
const wdFields={bkash:[{label:'Number',name:'account'}],nagad:[{label:'Number',name:'account'}],binance:[{label:'ID/Email',name:'account'}],paypal:[{label:'Email',name:'account'}],wise:[{label:'Email',name:'account'}],bank:[{label:'Account Name',name:'name'},{label:'Account No',name:'number'},{label:'Bank',name:'bank'}],crypto:[{label:'Wallet',name:'wallet'},{label:'Currency',name:'currency'}]};
function showWdForm(m){const c=document.getElementById('wdFormCard');c.classList.remove('hidden');document.getElementById('wdFormTitle').textContent=m.charAt(0).toUpperCase()+m.slice(1);const f=document.getElementById('wdFields');f.innerHTML='';(wdFields[m]||[{label:'Details',name:'details'}]).forEach(x=>f.innerHTML+=`<div class="input-group"><input type="text" name="${x.name}" placeholder="${x.label}" required></div>`);}
document.getElementById('wdForm')?.addEventListener('submit',async e=>{e.preventDefault();const m=document.querySelector('.wd-method.selected');if(!m){showToast('Select method','error');return;}const a=parseFloat(document.getElementById('wdAmount')?.value);if(a<5){showToast('Min $5','error');return;}if(a>Math.max(currentUserData?.balance||0,loc('bal'))){showToast('Insufficient','error');return;}const fd=new FormData(document.getElementById('wdForm'));const d={};fd.forEach((v,k)=>d[k]=v);try{await fbTimeout(withdrawalsRef.add({userId:currentUser.uid,userEmail:currentUser.email,userName:currentUserData?.name,method:m.dataset.method,amount:a,details:d,status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()}));await fbTimeout(usersRef.doc(currentUser.uid).update({balance:firebase.firestore.FieldValue.increment(-a),totalWithdrawn:firebase.firestore.FieldValue.increment(a)}));showToast('Submitted ✅');}catch(e){locAdd('bal',-a);showToast('Submitted (offline) ✅');}document.getElementById('wdFormCard').classList.add('hidden');if(currentUserData)currentUserData.balance=(currentUserData.balance||0)-a;updateUI();});

// ===== NOTIFICATIONS =====
function showNotif(t,m,icon){document.getElementById('notifIcon').textContent=icon||'🎉';document.getElementById('notifTitle').textContent=t;document.getElementById('notifMsg').textContent=m;document.getElementById('notifModal').classList.add('show');}
function closeNotif(){document.getElementById('notifModal').classList.remove('show');}

// ===== CAROUSEL =====
function startCarousel() {
  if(carouselTimer) clearInterval(carouselTimer);
  const track=document.getElementById('carouselTrack'); const dots=document.querySelectorAll('.dot');
  if(!track||!dots.length) return;
  carouselTimer=setInterval(()=>{carouselIdx=(carouselIdx+1)%dots.length;track.style.transform=`translateX(-${carouselIdx*100}%)`;dots.forEach((d,i)=>d.classList.toggle('active',i===carouselIdx));},5000);
  let sx=0;
  track.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});
  track.addEventListener('touchend',e=>{const d=sx-e.changedTouches[0].clientX;if(Math.abs(d)>50){if(d>0&&carouselIdx<dots.length-1)carouselIdx++;else if(d<0&&carouselIdx>0)carouselIdx--;track.style.transform=`translateX(-${carouselIdx*100}%)`;dots.forEach((x,i)=>x.classList.toggle('active',i===carouselIdx));}},{passive:true});
}

let carouselIdx = 0, carouselTimer = null;

// ===== COMMON =====
function fmtDate(ts) { if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);const diff=Date.now()-d;if(diff<60000)return'Just now';if(diff<3600000)return Math.floor(diff/60000)+'m ago';if(diff<86400000)return Math.floor(diff/3600000)+'h ago';return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function showToast(msg,type='success'){const c=document.getElementById('toast');const t=document.createElement('div');t.className='toast toast-'+type;t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),3000);}
document.getElementById('toggleBalance')?.addEventListener('click',()=>{const e=document.getElementById('balanceDisplay');if(e.dataset.hid==='1'){e.textContent='$'+Math.max(currentUserData?.balance||0,loc('bal')).toFixed(2);e.dataset.hid='0';}else{e.textContent='****';e.dataset.hid='1';}});

// Safety splash hide
setTimeout(()=>{document.getElementById('splash')?.classList.add('hide');if(!currentUser)showView('authPage');},5000);
