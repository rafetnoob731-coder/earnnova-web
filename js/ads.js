// =============================================
// EARNNOVA — Complete Ad Integration v4.0
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

// ===== 10. REWARDED AD SYSTEM =====
// Uses show_9622450() from loaded ad network
var RewardedAd = {
  _ready: false,
  _checkInterval: null,

  init: function() {
    if (typeof show_9622450 !== 'undefined') {
      this._ready = true;
      console.log('[ADS] ✅ Rewarded ads ready');
      return;
    }
    // Poll for show_9622450 to become available
    this._checkInterval = setInterval(function() {
      if (typeof show_9622450 !== 'undefined') {
        RewardedAd._ready = true;
        clearInterval(RewardedAd._checkInterval);
        console.log('[ADS] ✅ Rewarded ads ready');
      }
    }, 500);
    // Stop checking after 20s
    setTimeout(function() {
      if (RewardedAd._checkInterval) {
        clearInterval(RewardedAd._checkInterval);
        console.warn('[ADS] Rewarded ads not loaded');
      }
    }, 20000);
  },

  // ===== REWARDED INTERSTITIAL =====
  // fullscreen rewarded ad — user must watch till end
  showRewarded: function(callback) {
    callback = callback || function(){};
    if (this._ready && typeof show_9622450 !== 'undefined') {
      show_9622450().then(function() {
        console.log('[ADS] ✅ Rewarded ad completed');
        callback(true);
      }).catch(function(e) {
        console.warn('[ADS] Rewarded ad error:', e);
        callback(false);
      });
    } else {
      console.warn('[ADS] Rewarded not ready, fallback');
      callback(false);
    }
  },

  // ===== REWARDED POPUP =====
  // popup format — user can close, still counts
  showPopup: function(callback) {
    callback = callback || function(){};
    if (this._ready && typeof show_9622450 !== 'undefined') {
      show_9622450('pop').then(function() {
        console.log('[ADS] ✅ Popup ad completed');
        callback(true);
      }).catch(function(e) {
        console.warn('[ADS] Popup ad error:', e);
        callback(false);
      });
    } else {
      callback(false);
    }
  },

  // ===== IN-APP INTERSTITIAL (auto-managed) =====
  // Shows automatically with configurable frequency
  startInApp: function() {
    if (this._ready && typeof show_9622450 !== 'undefined') {
      show_9622450({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,     // 2 ads per session
          capping: 0.1,     // within 0.1 hours (6 min)
          interval: 30,     // 30s between ads
          timeout: 5,       // 5s delay before first
          everyPage: false  // session persists across pages
        }
      });
      console.log('[ADS] ✅ In-App interstitial started');
    }
  }
};

// ===== AD NETWORK MANAGER =====
var AdNetwork = {
  init: function() {
    console.log('[ADS] 🚀 Initializing all ad networks...');
    
    // Give networks time to register
    setTimeout(function() {
      RewardedAd.init();
      // Start in-app interstitial after 10s (user is engaged)
      setTimeout(function() { RewardedAd.startInApp(); }, 10000);
    }, 2000);
    
    this.createSlots();
  },

  // ===== AD SLOT CREATION =====
  createSlots: function() {
    var main = document.querySelector('.main-content');
    if (!main) return;
    
    // Top banner area
    var top = document.getElementById('adTop') || document.createElement('div');
    top.id = 'adTop';
    top.style.cssText = 'width:100%;min-height:60px;margin-bottom:12px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:8px';
    if (!document.getElementById('adTop')) main.insertBefore(top, main.firstChild);
    
    // Bottom ad area
    var bot = document.getElementById('adBottom') || document.createElement('div');
    bot.id = 'adBottom';
    bot.style.cssText = 'width:100%;min-height:90px;margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:8px';
    if (!document.getElementById('adBottom')) main.appendChild(bot);
    
    // HPF slots
    var h1 = document.createElement('div');
    h1.id = 'hpf-300x160';
    h1.style.cssText = 'margin:4px auto;text-align:center';
    top.appendChild(h1);
    
    var h2 = document.createElement('div');
    h2.id = 'hpf-468x60';
    h2.style.cssText = 'margin:4px auto;text-align:center';
    bot.appendChild(h2);
  },

  // ===== SHOW INTERSTITIAL BEFORE AD WATCH =====
  showInterstitial: function(callback) {
    callback = callback || function(){};
    
    // Try rewarded (full watch required)
    if (RewardedAd._ready) {
      RewardedAd.showRewarded(function(success) {
        if (success) {
          callback();
        } else {
          // Fallback to popup (no watch required)
          RewardedAd.showPopup(function(popSuccess) {
            if (popSuccess) {
              callback();
            } else {
              // Ultimate fallback
              AdNetwork._fallbackOverlay(callback);
            }
          });
        }
      });
    } else {
      AdNetwork._fallbackOverlay(callback);
    }
  },

  // ===== FALLBACK OVERLAY =====
  _fallbackOverlay: function(callback) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
    ov.innerHTML = 
      '<div style="background:rgba(16,24,40,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px 24px;text-align:center;max-width:300px;width:90%">' +
        '<div style="font-size:48px;margin-bottom:12px">📢</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:4px">Sponsored Moment</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Please wait...</div>' +
        '<div id="fallbackTimer" style="font-size:36px;font-weight:800;color:var(--gold);margin-bottom:16px">5</div>' +
        '<button id="fallbackBtn" style="padding:12px 32px;border-radius:10px;background:var(--gold);color:#0A0E1A;border:none;font-size:15px;font-weight:700;cursor:pointer;opacity:0.4" disabled>Skip</button>' +
      '</div>';
    document.body.appendChild(ov);
    
    var sec = 5;
    var t = setInterval(function() {
      sec--;
      var el = document.getElementById('fallbackTimer');
      if (el) el.textContent = sec;
      if (sec <= 0) {
        clearInterval(t);
        var btn = document.getElementById('fallbackBtn');
        if (btn) {
          btn.disabled = false; btn.style.opacity = '1';
          btn.textContent = 'Continue →';
          btn.onclick = function() { ov.remove(); callback(); };
        }
      }
    }, 1000);
    
    setTimeout(function() { ov.remove(); callback(); }, 8000);
  }
};

// ===== AUTO-START =====
if (document.readyState === 'complete') AdNetwork.init();
else window.addEventListener('load', function() { AdNetwork.init(); });

console.log('[ADS] ✅ EARNNOVA Ad Networks v4.0 loaded');
