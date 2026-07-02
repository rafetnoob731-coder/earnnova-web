// =============================================
// EARNNOVA — Ad Integration v5.1
// Adsterra · Monetag · Rewarded (high CPU)
// =============================================
// SAFE PLACEMENT — Dashboard only, compliant
// =============================================

// ===== 1. ADSTERRA — Popunder =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://quge5.com/88/tag.min.js';
  s.dataset.zone = '255448';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 2. MONETAG — Popunder =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pl29828447.effectivecpmnetwork.com/fc/ac/01/fcac01bcf8a7bc1e80bbba3ba4a24fed.js';
  s.async = true;
  document.head.appendChild(s);
})();

// ===== 3. MONETAG — Popunder (secondary) =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pl29828442.effectivecpmnetwork.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 4. MONETAG — Banner with container =====
(function() {
  var c = document.createElement('div');
  c.id = 'container-ac40f76d59b8e8c281fb380b91c2bf21';
  c.style.display = 'none';
  document.body.appendChild(c);
  var s = document.createElement('script');
  s.src = 'https://pl29828443.effectivecpmnetwork.com/ac40f76d59b8e8c281fb380b91c2bf21/invoke.js';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.body.appendChild(s);
})();

// ===== 5. MONETAG — Iframe =====
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

// ===== 6. HIGH CPU REWARDED ADS =====
// show_9622450 — Rewarded interstitial, popup, and inApp auto
var RewardedHighCPU = {
  _ready: false,

  init: function() {
    if (typeof show_9622450 !== 'undefined') {
      this._ready = true;
      console.log('[ADS] ✅ Rewarded high-CPU ready');

      // Auto-start inApp interstitials (every 6 min)
      setTimeout(function() {
        try {
          show_9622450({
            type: 'inApp',
            inAppSettings: {
              frequency: 2,     // 2 ads per session
              capping: 0.1,     // within 6 minutes
              interval: 30,     // 30s between ads
              timeout: 5,       // 5s delay before first
              everyPage: false  // session persists
            }
          });
          console.log('[ADS] ✅ In-App interstitials active');
        } catch(e) { console.warn('[ADS] inApp error:', e); }
      }, 5000);
    } else {
      console.log('[ADS] show_9622450 not loaded yet, polling...');
      // Poll for it
      var check = setInterval(function() {
        if (typeof show_9622450 !== 'undefined') {
          RewardedHighCPU._ready = true;
          clearInterval(check);
          console.log('[ADS] ✅ Rewarded high-CPU ready (late)');
        }
      }, 1000);
      setTimeout(function() { clearInterval(check); }, 30000);
    }
  },

  // Try rewarded → popup → false
  show: function(callback) {
    callback = callback || function(){};

    if (typeof show_9622450 !== 'undefined') {
      // Try rewarded interstitial first (highest CPU)
      try {
        show_9622450().then(function() {
          console.log('[ADS] ✅ Rewarded interstitial done (high CPU!)');
          callback(true);
        }).catch(function() {
          // Fallback to popup (still pays)
          try {
            show_9622450('pop').then(function() {
              console.log('[ADS] ✅ Rewarded popup done');
              callback(true);
            }).catch(function() {
              callback(false);
            });
          } catch(e) { callback(false); }
        });
      } catch(e) { callback(false); }
    } else {
      callback(false);
    }
  }
};

// ===== SAFE AD PLACEMENT MANAGER =====
var SafeAdNetwork = {
  init: function() {
    console.log('[SAFE ADS] 🚀 Initializing...');
    RewardedHighCPU.init();
    this.createSlots();
    this._showComplianceNotice();
  },

  createSlots: function() {
    var main = document.querySelector('.main-content');
    if (!main) return;

    var topSlot = document.createElement('div');
    topSlot.id = 'adTopSafe';
    topSlot.style.cssText = 'width:100%;min-height:60px;margin:8px 0 12px;display:flex;justify-content:center;align-items:center;padding:4px 0';
    if (!document.getElementById('adTopSafe')) main.insertBefore(topSlot, main.firstChild);

    var bottomSlot = document.createElement('div');
    bottomSlot.id = 'adBottomSafe';
    bottomSlot.style.cssText = 'width:100%;min-height:60px;margin:16px 0 4px;display:flex;flex-direction:column;align-items:center;padding:4px 0';
    if (!document.getElementById('adBottomSafe')) main.appendChild(bottomSlot);
  },

  _showComplianceNotice: function() {
    var footer = document.querySelector('.main-content');
    if (!footer) return;
    var notice = document.getElementById('adComplianceNotice');
    if (notice) return;
    notice = document.createElement('div');
    notice.id = 'adComplianceNotice';
    notice.style.cssText = 'text-align:center;padding:16px 12px 8px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.5px;line-height:1.6';
    notice.innerHTML =
      'Ads help keep EARNNOVA free. By using this platform you agree to our ' +
      '<a href="/terms.html" style="color:var(--gold);text-decoration:underline">Terms</a> and ' +
      '<a href="/privacy.html" style="color:var(--gold);text-decoration:underline">Privacy Policy</a>. ' +
      'You must be 18+ to use this service.';
    footer.appendChild(notice);
  },

  // ===== SHOW INTERSTITIAL BEFORE AD WATCH =====
  showInterstitial: function(callback) {
    callback = callback || function(){};

    // FIRST: Try rewarded high-CPU ad
    RewardedHighCPU.show(function(success) {
      if (success) {
        callback();
      } else {
        // FALLBACK: Premium overlay (always works)
        SafeAdNetwork._showFallbackOverlay(callback);
      }
    });
  },

  // ===== PREMIUM FALLBACK =====
  _showFallbackOverlay: function(callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.4s ease';
    overlay.innerHTML =
      '<div style="background:linear-gradient(145deg,rgba(20,28,48,0.98),rgba(10,14,26,0.98));border:1px solid rgba(212,175,55,0.15);border-radius:28px;padding:36px 28px;text-align:center;max-width:320px;width:92%;box-shadow:0 24px 80px rgba(0,0,0,0.6)">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#b8962f);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;box-shadow:0 8px 32px rgba(212,175,55,0.3)">⭐</div>' +
        '<div style="font-size:18px;font-weight:800;margin-bottom:4px;background:linear-gradient(135deg,var(--gold),#fff2c0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Sponsored</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Quick moment to support us</div>' +
        '<div style="width:100%;height:120px;border-radius:16px;background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(16,185,129,0.08));border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;margin-bottom:20px;position:relative;overflow:hidden">' +
          '<div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);animation:shimmer 2s infinite"></div>' +
          '<div style="text-align:center"><div style="font-size:36px;margin-bottom:4px">📢</div><div style="font-size:10px;color:rgba(255,255,255,0.2)">ad</div></div>' +
        '</div>' +
        '<div style="width:100%;height:4px;border-radius:4px;background:rgba(255,255,255,0.06);margin-bottom:12px;overflow:hidden">' +
          '<div id="safeProgress" style="height:100%;width:0%;border-radius:4px;background:linear-gradient(90deg,var(--gold),var(--emerald));transition:width 0.3s linear"></div>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Loading... <span id="safeCount" style="color:var(--gold);font-weight:700">5</span>s</div>' +
        '<button id="safeContinueBtn" style="padding:14px 40px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#b8962f);color:#0A0E1A;border:none;font-size:15px;font-weight:800;cursor:pointer;opacity:0.4;transition:all 0.3s;width:100%" disabled>⏳ Please wait...</button>' +
      '</div>';

    document.body.appendChild(overlay);

    var seconds = 5;
    var countEl = document.getElementById('safeCount');
    var progress = document.getElementById('safeProgress');
    var btn = document.getElementById('safeContinueBtn');

    var timer = setInterval(function() {
      seconds--;
      if (countEl) countEl.textContent = seconds;
      if (progress) progress.style.width = ((5 - seconds) / 5 * 100) + '%';
      if (seconds <= 0) {
        clearInterval(timer);
        if (progress) progress.style.width = '100%';
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = '✅ Continue → Get Reward';
          btn.onclick = function() { overlay.remove(); callback(); };
        }
      }
    }, 1000);
    setTimeout(function() { clearInterval(timer); overlay.remove(); callback(); }, 8000);
  }
};

// ===== AUTO-START =====
if (document.readyState === 'complete') SafeAdNetwork.init();
else window.addEventListener('load', function() { SafeAdNetwork.init(); });

console.log('[ADS] ✅ EARNNOVA v5.1 — Adsterra + Monetag + High-CPU Rewarded');
