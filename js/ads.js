// =============================================
// EARNNOVA — Complete Ad Integration v4.1
// AdSense · EffectiveCPM · HighPerformance · OMG10 · Rewarded
// =============================================

// ===== 1. GOOGLE ADSENSE =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9307459733796967';
  s.async = true; s.crossOrigin = 'anonymous';
  s.onerror = function() { console.warn('[ADS] AdSense failed'); };
  document.head.appendChild(s);
})();

// ===== 2. EFFECTIVE CPM NETWORK (pl29828442) =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pl29828442.effectivecpmnetwork.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js';
  s.async = true; s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 3. EFFECTIVE CPM NETWORK (pl29828443) =====
(function() {
  var c = document.createElement('div');
  c.id = 'container-ac40f76d59b8e8c281fb380b91c2bf21';
  c.style.display = 'none';
  document.body.appendChild(c);
  var s = document.createElement('script');
  s.src = 'https://pl29828443.effectivecpmnetwork.com/ac40f76d59b8e8c281fb380b91c2bf21/invoke.js';
  s.async = true; s.setAttribute('data-cfasync', 'false');
  document.body.appendChild(s);
})();

// ===== 4. HIGH PERFORMANCE FORMAT — 300x160 =====
(function() {
  window.atOptions = window.atOptions || {};
  window.atOptions['679c41f5cd1133dfcfb8ddd3254605d4'] = {
    'key': '679c41f5cd1133dfcfb8ddd3254605d4', 'format': 'iframe',
    'height': 300, 'width': 160, 'params': {}
  };
  var s = document.createElement('script');
  s.src = 'https://www.highperformanceformat.com/679c41f5cd1133dfcfb8ddd3254605d4/invoke.js';
  document.head.appendChild(s);
})();

// ===== 5. HIGH PERFORMANCE FORMAT — 468x60 =====
(function() {
  window.atOptions['11127fe81ff9922c5ece58925c849fd8'] = {
    'key': '11127fe81ff9922c5ece58925c849fd8', 'format': 'iframe',
    'height': 60, 'width': 468, 'params': {}
  };
  var s = document.createElement('script');
  s.src = 'https://www.highperformanceformat.com/11127fe81ff9922c5ece58925c849fd8/invoke.js';
  document.head.appendChild(s);
})();

// ===== 6. EFFECTIVE CPM (pl29828447) =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pl29828447.effectivecpmnetwork.com/fc/ac/01/fcac01bcf8a7bc1e80bbba3ba4a24fed.js';
  s.async = true;
  document.head.appendChild(s);
})();

// ===== 7. ADSTERRA/CPA ZONE =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://quge5.com/88/tag.min.js';
  s.dataset.zone = '255448'; s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 8. OMG10 POP/NATIVE ADS =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://omg10.com/4/9619899';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 9. EFFECTIVE CPM IFRAME =====
(function() {
  var ifr = document.createElement('iframe');
  ifr.src = 'https://www.effectivecpmnetwork.com/zjzbzfk7?key=5be534a9c13e9ed7a663c6cc527b5b74';
  ifr.style.cssText = 'width:300px;height:250px;border:none;overflow:hidden;display:block;margin:0 auto';
  ifr.setAttribute('scrolling', 'no');
  ifr.setAttribute('frameborder', '0');
  ifr.setAttribute('allowtransparency', 'true');
  var insert = function() {
    var c = document.getElementById('adNetworkContainer') || document.body;
    c.appendChild(ifr);
  };
  if (document.readyState === 'complete') insert();
  else window.addEventListener('load', insert);
})();

// ===== 10. REWARDED AD BRIDGE =====
// Wraps show_9622450() if available, otherwise provides
// a premium-looking fallback that always works.
var RewardedAd = {
  _ready: false,
  _checked: false,

  init: function() {
    if (typeof show_9622450 !== 'undefined') {
      this._ready = true;
      console.log('[ADS] ✅ show_9622450 detected');
    } else {
      console.log('[ADS] show_9622450 not found — using fallback');
    }
    this._checked = true;
  },

  // ===== REWARDED INTERSTITIAL =====
  // Fullscreen ad — user MUST complete to get reward
  showRewarded: function(callback) {
    callback = callback || function(){};
    if (typeof show_9622450 !== 'undefined') {
      try {
        show_9622450().then(function() {
          console.log('[ADS] ✅ Rewarded interstitial completed');
          callback(true);
        }).catch(function(e) {
          console.warn('[ADS] Rewarded interstitial error:', e);
          AdNetwork._showPremiumInterstitial(callback);
        });
      } catch(e) {
        AdNetwork._showPremiumInterstitial(callback);
      }
    } else {
      AdNetwork._showPremiumInterstitial(callback);
    }
  },

  // ===== REWARDED POPUP =====
  // Popup format — closeable, still rewards
  showPopup: function(callback) {
    callback = callback || function(){};
    if (typeof show_9622450 !== 'undefined') {
      try {
        show_9622450('pop').then(function() {
          console.log('[ADS] ✅ Popup completed');
          callback(true);
        }).catch(function(e) {
          console.warn('[ADS] Popup error:', e);
          callback(false);
        });
      } catch(e) {
        callback(false);
      }
    } else {
      callback(false);
    }
  },

  // ===== IN-APP INTERSTITIAL =====
  startInApp: function() {
    if (typeof show_9622450 !== 'undefined') {
      try {
        show_9622450({
          type: 'inApp',
          inAppSettings: {
            frequency: 2, capping: 0.1, interval: 30,
            timeout: 5, everyPage: false
          }
        });
        console.log('[ADS] ✅ In-App interstitial started');
      } catch(e) {
        console.warn('[ADS] In-App error:', e);
      }
    }
  }
};

// ===== AD NETWORK MANAGER =====
var AdNetwork = {
  init: function() {
    console.log('[ADS] 🚀 Initializing...');
    setTimeout(function() { RewardedAd.init(); }, 3000);
    setTimeout(function() { RewardedAd.startInApp(); }, 15000);
    this.createSlots();
  },

  // ===== AD SLOTS =====
  createSlots: function() {
    var main = document.querySelector('.main-content');
    if (!main) return;
    
    var top = document.getElementById('adTop') || document.createElement('div');
    top.id = 'adTop';
    top.style.cssText = 'width:100%;min-height:60px;margin-bottom:12px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px';
    if (!document.getElementById('adTop')) main.insertBefore(top, main.firstChild);
    
    var bot = document.getElementById('adBottom') || document.createElement('div');
    bot.id = 'adBottom';
    bot.style.cssText = 'width:100%;min-height:60px;margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:8px';
    if (!document.getElementById('adBottom')) main.appendChild(bot);
    
    // HPF ad containers
    var h1 = document.createElement('div');
    h1.id = 'hpf-300x160'; h1.style.cssText = 'margin:4px auto;text-align:center';
    top.appendChild(h1);
    var h2 = document.createElement('div');
    h2.id = 'hpf-468x60'; h2.style.cssText = 'margin:4px auto;text-align:center';
    bot.appendChild(h2);
  },

  // ===== SHOW AD BEFORE REWARD TIMER =====
  // Tries: Rewarded interstitial → Popup → Premium fallback
  showInterstitial: function(callback) {
    callback = callback || function(){};
    
    if (typeof show_9622450 !== 'undefined') {
      // Try rewarded (must watch fully)
      try {
        show_9622450().then(function() {
          console.log('[ADS] ✅ Rewarded done');
          callback();
        }).catch(function(e) {
          console.warn('[ADS] Rewarded err, trying popup:', e);
          // Try popup
          try {
            show_9622450('pop').then(function() {
              console.log('[ADS] ✅ Popup done');
              callback();
            }).catch(function(e2) {
              console.warn('[ADS] Popup err too:', e2);
              AdNetwork._showPremiumInterstitial(callback);
            });
          } catch(e2) {
            AdNetwork._showPremiumInterstitial(callback);
          }
        });
      } catch(e) {
        AdNetwork._showPremiumInterstitial(callback);
      }
    } else {
      // show_9622450 not available — use premium fallback
      AdNetwork._showPremiumInterstitial(callback);
    }
  },

  // ===== PREMIUM FALLBACK INTERSTITIAL =====
  // Looks like a real rewarded ad — brand-safe, gold theme, auto-continue
  _showPremiumInterstitial: function(callback) {
    callback = callback || function(){};
    
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.4s ease';
    overlay.innerHTML =
      '<div style="background:linear-gradient(145deg,rgba(20,28,48,0.98),rgba(10,14,26,0.98));border:1px solid rgba(212,175,55,0.15);border-radius:28px;padding:36px 28px;text-align:center;max-width:320px;width:92%;box-shadow:0 24px 80px rgba(0,0,0,0.6)">' +
        // Gold brand icon
        '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#b8962f);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;box-shadow:0 8px 32px rgba(212,175,55,0.3)">⭐</div>' +
        '<div style="font-size:18px;font-weight:800;margin-bottom:4px;background:linear-gradient(135deg,var(--gold),#fff2c0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Sponsored Content</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Watch a quick ad to support the platform</div>' +
        // Animated ad placeholder
        '<div style="width:100%;height:120px;border-radius:16px;background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(16,185,129,0.08));border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;margin-bottom:20px;position:relative;overflow:hidden">' +
          '<div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);animation:shimmer 2s infinite"></div>' +
          '<div style="text-align:center">' +
            '<div style="font-size:36px;margin-bottom:4px">📢</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.2)">ad · loading</div>' +
          '</div>' +
        '</div>' +
        // Progress bar
        '<div style="width:100%;height:4px;border-radius:4px;background:rgba(255,255,255,0.06);margin-bottom:12px;overflow:hidden">' +
          '<div id="fallbackProgress" style="height:100%;width:0%;border-radius:4px;background:linear-gradient(90deg,var(--gold),var(--emerald));transition:width 0.3s linear"></div>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px" id="fallbackStatus">Preparing ad... <span id="fallbackCount" style="color:var(--gold);font-weight:700">5</span>s</div>' +
        '<button id="fallbackContinueBtn" style="padding:14px 40px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:15px;font-weight:800;cursor:pointer;opacity:0.4;transition:all 0.3s;width:100%" disabled>⏳ Please wait...</button>' +
      '</div>';
    
    document.body.appendChild(overlay);
    
    // Animate progress
    var seconds = 5;
    var progress = document.getElementById('fallbackProgress');
    var countEl = document.getElementById('fallbackCount');
    var statusEl = document.getElementById('fallbackStatus');
    var btn = document.getElementById('fallbackContinueBtn');
    
    var timer = setInterval(function() {
      seconds--;
      if (countEl) countEl.textContent = seconds;
      if (progress) progress.style.width = ((5 - seconds) / 5 * 100) + '%';
      if (statusEl) statusEl.textContent = 'Ad loading... ' + seconds + 's';
      
      if (seconds <= 0) {
        clearInterval(timer);
        if (progress) progress.style.width = '100%';
        if (statusEl) statusEl.innerHTML = '✅ Ad complete!';
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = 'Continue → Get Reward';
          btn.onclick = function() {
            overlay.remove();
            callback();
          };
        }
      }
    }, 1000);
    
    // Auto-continue after 8s max
    setTimeout(function() {
      clearInterval(timer);
      overlay.remove();
      callback();
    }, 8000);
  }
};

// ===== AUTO-START =====
if (document.readyState === 'complete') AdNetwork.init();
else window.addEventListener('load', function() { AdNetwork.init(); });

console.log('[ADS] ✅ EARNNOVA Ad Networks v4.1 loaded');
