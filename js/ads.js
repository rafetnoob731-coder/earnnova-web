// =============================================
// EARNNOVA — Ad Integration v5.2
// AdSense · Adsterra · Monetag SDK (show_9622450)
// =============================================
// The Monetag SDK is loaded via HTML:
// <script src="//libtl.com/sdk.js" data-zone="9622450" data-sdk="show_9622450"></script>
// =============================================

// ===== REWARDED HIGH-CPU ADS (Monetag SDK) =====
var RewardedHighCPU = {
  _ready: false,
  _checkTimer: null,

  init: function() {
    this._checkSDK();
  },

  _checkSDK: function() {
    if (typeof show_9622450 !== 'undefined') {
      this._ready = true;
      console.log('[MONETAG] ✅ SDK ready — show_9622450() available');

      // Start in-app interstitials automatically
      try {
        show_9622450({
          type: 'inApp',
          inAppSettings: {
            frequency: 2, capping: 0.1,
            interval: 30, timeout: 5,
            everyPage: false
          }
        });
        console.log('[MONETAG] ✅ In-App interstitials active');
      } catch(e) {
        console.warn('[MONETAG] inApp start error:', e);
      }
      return;
    }

    // SDK not loaded yet — poll
    if (!this._checkTimer) {
      console.log('[MONETAG] ⏳ Waiting for SDK...');
      this._checkTimer = setInterval(function() {
        if (typeof show_9622450 !== 'undefined') {
          clearInterval(RewardedHighCPU._checkTimer);
          RewardedHighCPU._checkTimer = null;
          RewardedHighCPU._ready = true;
          console.log('[MONETAG] ✅ SDK ready');

          // Start in-app after detection
          try {
            show_9622450({
              type: 'inApp',
              inAppSettings: {
                frequency: 2, capping: 0.1,
                interval: 30, timeout: 5,
                everyPage: false
              }
            });
          } catch(e) {}
        }
      }, 1000);

      // Stop polling after 20 seconds
      setTimeout(function() {
        if (RewardedHighCPU._checkTimer) {
          clearInterval(RewardedHighCPU._checkTimer);
          RewardedHighCPU._checkTimer = null;
          if (!RewardedHighCPU._ready) {
            console.warn('[MONETAG] ❌ SDK not loaded after 20s');
          }
        }
      }, 20000);
    }
  },

  // Show rewarded ad before earning
  show: function(callback) {
    callback = callback || function(){};

    if (typeof show_9622450 !== 'undefined') {
      // Rewarded interstitial — user MUST watch full ad
      try {
        show_9622450().then(function() {
          console.log('[MONETAG] ✅ Rewarded interstitial completed');
          callback(true);
        }).catch(function(e) {
          console.warn('[MONETAG] Rewarded error:', e);
          // Try popup fallback (closeable, still rewards)
          try {
            show_9622450('pop').then(function() {
              console.log('[MONETAG] ✅ Popup completed');
              callback(true);
            }).catch(function() {
              callback(false);
            });
          } catch(e2) {
            callback(false);
          }
        });
      } catch(e) {
        callback(false);
      }
    } else {
      callback(false);
    }
  }
};

// ===== SAFE AD PLACEMENT MANAGER =====
var SafeAdNetwork = {
  init: function() {
    console.log('[ADS] 🚀 Initializing...');
    RewardedHighCPU.init();
    this.createSlots();
    this._showComplianceNotice();
  },

  createSlots: function() {
    var main = document.querySelector('.main-content');
    if (!main) return;

    // Top banner
    var topSlot = document.getElementById('adTopSafe');
    if (!topSlot) {
      topSlot = document.createElement('div');
      topSlot.id = 'adTopSafe';
      topSlot.style.cssText = 'width:100%;min-height:60px;margin:8px 0 12px;display:flex;justify-content:center;align-items:center;padding:4px 0';
      main.insertBefore(topSlot, main.firstChild);
    }

    // Bottom banner
    var bottomSlot = document.getElementById('adBottomSafe');
    if (!bottomSlot) {
      bottomSlot = document.createElement('div');
      bottomSlot.id = 'adBottomSafe';
      bottomSlot.style.cssText = 'width:100%;min-height:60px;margin:16px 0 4px;display:flex;flex-direction:column;align-items:center;padding:4px 0';
      main.appendChild(bottomSlot);
    }

    // Render AdSense after a delay
    setTimeout(function() {
      if (typeof adsbygoogle !== 'undefined') {
        SafeAdNetwork._renderAdsense(topSlot, bottomSlot);
      }
    }, 3000);
  },

  _renderAdsense: function(top, bottom) {
    try {
      var ins1 = document.createElement('ins');
      ins1.className = 'adsbygoogle';
      ins1.style.cssText = 'display:inline-block;width:320px;height:50px';
      ins1.dataset.adClient = 'ca-pub-9307459733796967';
      top.innerHTML = '';
      top.appendChild(ins1);
      (adsbygoogle = window.adsbygoogle || []).push({});

      var ins2 = document.createElement('ins');
      ins2.className = 'adsbygoogle';
      ins2.style.cssText = 'display:inline-block;width:320px;height:50px';
      ins2.dataset.adClient = 'ca-pub-9307459733796967';
      bottom.innerHTML = '';
      bottom.appendChild(ins2);
      (adsbygoogle = window.adsbygoogle || []).push({});

      console.log('[ADS] ✅ AdSense rendered');
    } catch(e) {
      console.warn('[ADS] AdSense render error:', e.message);
    }
  },

  _showComplianceNotice: function() {
    var footer = document.querySelector('.main-content');
    if (!footer) return;
    if (document.getElementById('adComplianceNotice')) return;
    var notice = document.createElement('div');
    notice.id = 'adComplianceNotice';
    notice.style.cssText = 'text-align:center;padding:16px 12px 8px;font-size:10px;color:rgba(255,255,255,0.12)';
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

    // Try Monetag rewarded ad (HIGH CPU)
    RewardedHighCPU.show(function(success) {
      if (success) {
        callback();
      } else {
        // Premium fallback overlay
        SafeAdNetwork._showFallbackOverlay(callback);
      }
    });
  },

  // ===== PREMIUM FALLBACK OVERLAY =====
  _showFallbackOverlay: function(callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.4s ease';
    overlay.innerHTML =
      '<div style="background:linear-gradient(145deg,rgba(20,28,48,0.98),rgba(10,14,26,0.98));border:1px solid rgba(212,175,55,0.15);border-radius:28px;padding:36px 28px;text-align:center;max-width:320px;width:92%">' +
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

console.log('[ADS] ✅ EARNNOVA v5.2 — AdSense + Adsterra + Monetag SDK (show_9622450)');
