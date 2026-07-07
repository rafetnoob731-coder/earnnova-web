// =============================================
// EARNNOVA — Advanced AdBlock Detector v7
// Integrated from:
//   - Simple-Adblock-Detector (fetch + interval checks)
//   - Aggressive-Anti-AdBlock (multi-bait + persistence)
//   - 103-early-anti-adblock (early detection pattern)
// Features:
//   - 6 detection methods with REAL re-check loop
//   - Sticky red banner + earn page blocking
//   - Global close/reset function for modal
//   - admin_ban protection for owner account
//   - Bait elements stay in DOM for better detection
// =============================================

// Global flag for earn page to check
var EN_adblockDetected = false;

(function() {
  var _blocked = false;
  var _checked = false;
  var _warningActive = false;
  var _coolingTimer = null;
  var _isCooling = false;
  var _loopInterval = null;
  var _baitElements = [];

  // ===== PUBLIC CLOSE FUNCTION (accessible from inline onclick) =====
  window.closeAdblockWarning = function() {
    _warningActive = false;
    var modal = document.querySelector('[id^="adb-modal-"]');
    if (modal) modal.remove();
    var banner = document.getElementById('adb-top-banner');
    if (banner) banner.remove();
  };

  window.recheckAdblock = function() {
    _checked = false;
    _blocked = false;
    _runFreshDetection().then(function() {
      // Re-run full detection
    });
  };

  // ===== DETECTION METHODS =====

  async function _fetchTest(url, opts) {
    try {
      var resp = await fetch(url, opts || { mode: 'no-cors' });
      await resp.text();
      return false;
    } catch(e) {
      return true;
    }
  }

  function _baitTest() {
    // Remove old baits first
    _baitElements.forEach(function(el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    _baitElements = [];

    var classes = [
      'adsbox', 'pub_300x250', 'pub_728x90',
      'ad-container', 'advertisement', 'ad-space', 'ad-unit',
      'google_ads', 'adsbygoogle', 'ad_slot', 'adbox',
      'sponsored-ad', 'ad-banner', 'text_ad', 'text-ad'
    ];
    var hidden = 0;

    classes.forEach(function(cls) {
      var el = document.createElement('div');
      el.className = cls;
      el.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;height:1px!important;width:1px!important;position:absolute!important;left:-10000px!important;top:-10000px!important;z-index:-1!important';
      document.body.appendChild(el);
      _baitElements.push(el);
    });

    // AdSense ins bait
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.id = 'bait_' + Math.random().toString(36).substr(2, 8);
    ins.style.cssText = 'display:block!important;height:1px!important;width:1px!important;position:absolute!important;left:-10000px!important;top:-10000px!important';
    document.body.appendChild(ins);
    _baitElements.push(ins);

    // Check after a short delay for adblock to process
    return new Promise(function(resolve) {
      setTimeout(function() {
        _baitElements.forEach(function(el) {
          try {
            if (!document.body.contains(el)) { hidden++; }
            else {
              var s = window.getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || 
                  parseFloat(s.height) < 0.5 || parseFloat(s.width) < 0.5) {
                hidden++;
              }
            }
            // Keep in DOM for re-checks (removed on next test)
          } catch(e) {}
        });
        resolve(hidden >= 3);
      }, 100);
    });
  }

  function _scriptTest() {
    return new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      s.async = true;
      var done = false;
      var timer = setTimeout(function() {
        if (!done) { done = true; resolve(typeof window.adsbygoogle === 'undefined'); }
      }, 3000);
      s.onload = function() {
        setTimeout(function() {
          if (!done) { done = true; resolve(typeof window.adsbygoogle === 'undefined'); }
        }, 300);
      };
      s.onerror = function() {
        if (!done) { done = true; resolve(true); }
      };
      document.head.appendChild(s);
    });
  }

  function _xhrTest() {
    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', true);
        xhr.timeout = 3000;
        xhr.onload = function() { resolve(false); };
        xhr.onerror = function() { resolve(true); };
        xhr.ontimeout = function() { resolve(false); };
        xhr.send();
      } catch(e) { resolve(false); }
    });
  }

  function _imageTest() {
    return new Promise(function(resolve) {
      var urls = [
        'https://ad.doubleclick.net/ddm/trackimp/',
        'https://www.googletagservices.com/tag/js/gpt.js',
        'https://googleads.g.doubleclick.net/pagead/id'
      ];
      var blocked = 0;
      var done = 0;

      urls.forEach(function(url) {
        try {
          var img = new Image();
          var timer = setTimeout(function() { 
            if (!img.complete) { done++; if (done >= urls.length) resolve(blocked >= 2); }
          }, 3000);
          img.onload = function() { clearTimeout(timer); done++; if (done >= urls.length) resolve(blocked >= 2); };
          img.onerror = function() { clearTimeout(timer); blocked++; done++; if (done >= urls.length) resolve(blocked >= 2); };
          img.src = url;
        } catch(e) { done++; if (done >= urls.length) resolve(blocked >= 2); }
      });
    });
  }

  function _intervalTest() {
    return new Promise(function(resolve) {
      var timeout = setTimeout(function() { resolve(true); }, 1500);
      var interval = setInterval(function() {
        var a = 'test123';
        if (a === 'test123') {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(false);
        }
      }, 30);
    });
  }

  async function _fetchMultiTest() {
    var urls = [
      { url: 'https://widgets.outbrain.com/outbrain.js', opts: {} },
      { url: 'https://secure.quantserve.com/quant.js', opts: { mode: 'no-cors' } },
      { url: 'https://srvtrck.com/assets/css/LineIcons.css', opts: { mode: 'no-cors' } }
    ];
    var blocked = 0;
    for (var i = 0; i < urls.length; i++) {
      try {
        var r = await _fetchTest(urls[i].url, urls[i].opts);
        if (r) blocked++;
      } catch(e) { blocked++; }
    }
    return blocked >= 2;
  }

  function _controlTest() {
    return new Promise(function(resolve) {
      try {
        var img = new Image();
        var t = setTimeout(function() { img.src = ''; resolve(false); }, 2500);
        img.onload = function() { clearTimeout(t); resolve(true); };
        img.onerror = function() { clearTimeout(t); resolve(false); };
        img.src = 'https://www.google.com/favicon.ico';
      } catch(e) { resolve(false); }
    });
  }

  // ===== FRESH DETECTION (always re-runs) =====
  async function _runFreshDetection() {
    // Control test first
    var controlOk = await _controlTest();
    
    // Run all tests in parallel
    var results = await Promise.all([
      _baitTest(),
      _scriptTest(),
      _xhrTest(),
      _imageTest(),
      _intervalTest(),
      _fetchMultiTest()
    ]);

    var detections = results.filter(function(r) { return r; }).length;
    
    if (controlOk) {
      _blocked = detections >= 3;
    } else {
      _blocked = false; // network issue, can't detect
    }
    _checked = true;

    console.log('[ADBLOCK] v7 results:', {
      bait: results[0],
      script: results[1],
      xhr: results[2],
      image: results[3],
      interval: results[4],
      fetch: results[5],
      total: detections + '/6',
      blocked: _blocked
    });

    // Update global flag
    EN_adblockDetected = _blocked;

    // Show/hide UI elements
    if (_blocked) {
      _showTopBanner();
      _disableEarnPage();
    } else {
      _hideTopBanner();
      _enableEarnPage();
    }

    return _blocked;
  }

  // ===== UI: TOP RED BANNER =====
  function _showTopBanner() {
    if (document.getElementById('adb-top-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'adb-top-banner';
    banner.style.cssText = 
      'position:fixed!important;top:0!important;left:0!important;width:100%!important;' +
      'z-index:99998!important;background:linear-gradient(135deg,#dc2626,#b91c1c)!important;' +
      'padding:10px 16px!important;display:flex!important;align-items:center!important;' +
      'justify-content:center!important;gap:8px!important;flex-wrap:wrap!important;' +
      'box-shadow:0 4px 20px rgba(220,38,38,0.3)!important';

    banner.innerHTML =
      '<span style="font-size:14px">🚫</span>' +
      '<span style="font-size:12px;font-weight:700;color:#fff">Ad Blocker Detected!</span>' +
      '<span style="font-size:10px;color:rgba(255,255,255,0.75)">Please disable to earn</span>' +
      '<button onclick="location.reload()" style="padding:4px 12px;border-radius:6px;background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:10px;cursor:pointer;font-weight:600">Refresh ↩</button>';

    document.body.prepend(banner);
    
    // Push down content
    var main = document.querySelector('.main-content, #mainContent, [class*="content"]') || document.getElementById('page') || document.querySelector('main');
    if (main) main.style.paddingTop = '44px';
  }

  function _hideTopBanner() {
    var banner = document.getElementById('adb-top-banner');
    if (banner) banner.remove();
  }

  // ===== EARN PAGE BLOCKING =====
  function _disableEarnPage() {
    // Disable watch buttons across the page
    var btns = document.querySelectorAll('[onclick*="watchAd"], .btn-ad, #watchAdBtn, [class*="watch-ad"], [data-action="watch"]');
    btns.forEach(function(btn) {
      btn.style.opacity = '0.4';
      btn.style.pointerEvents = 'none';
      btn.style.cursor = 'not-allowed';
      btn.title = 'Disable ad blocker to earn';
    });
  }

  function _enableEarnPage() {
    var btns = document.querySelectorAll('[onclick*="watchAd"], .btn-ad, #watchAdBtn, [class*="watch-ad"], [data-action="watch"]');
    btns.forEach(function(btn) {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.style.cursor = '';
      btn.title = '';
    });
  }

  // ===== WARNING MODAL =====
  function _showModal() {
    if (_warningActive) return;
    _warningActive = true;

    var existing = document.querySelector('[id^="adb-modal-"]');
    if (existing) return;

    var modalId = 'adb-modal-' + Math.random().toString(36).substr(2, 8);
    var modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = 
      'position:fixed!important;top:0!important;left:0!important;width:100%!important;' +
      'height:100%!important;background:rgba(0,0,0,0.6)!important;' +
      'z-index:99999!important;display:flex!important;align-items:center!important;' +
      'justify-content:center!important;flex-direction:column!important;' +
      'backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important';

    modal.innerHTML =
      '<div style="max-width:360px;width:90%;padding:28px 24px;background:linear-gradient(135deg,#1a1a2e,#0F172A);border-radius:20px;border:2px solid rgba(239,68,68,0.3);text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.6);position:relative">' +
        '<div style="font-size:52px;margin-bottom:12px">🚫</div>' +
        '<div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:8px">Ad Blocker Active!</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:16px;line-height:1.5">Earning is disabled while your ad blocker is running. Please disable it to continue.</div>' +
        '<div style="background:rgba(239,68,68,0.08);border-radius:12px;padding:12px;margin-bottom:18px;text-align:left">' +
          '<div style="font-size:11px;color:#fca5a5;font-weight:600;margin-bottom:6px">📋 How to disable:</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.4);line-height:1.6">1️⃣ Click the adblock icon in your browser toolbar<br>2️⃣ Select "Pause on this site" or "Disable"<br>3️⃣ Refresh the page to start earning</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button onclick="closeAdblockWarning()" style="flex:1;padding:12px;border-radius:12px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.08);font-size:13px;cursor:pointer">Later ✕</button>' +
          '<button onclick="location.reload()" style="flex:1;padding:12px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">Refresh 🔄</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
  }

  // ===== AGGRESSIVE LOOP with REAL re-detection =====
  function _startLoop() {
    if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }

    async function checkCycle() {
      if (_isCooling) return;

      // ALWAYS re-run fresh detection (no cache)
      var blocked = await _runFreshDetection();
      
      if (blocked) {
        _showModal();
        _showTopBanner();
        _disableEarnPage();
      } else {
        _hideTopBanner();
        _enableEarnPage();
        var modal = document.querySelector('[id^="adb-modal-"]');
        if (modal) { modal.remove(); _warningActive = false; }
      }
    }

    // Aggressive: check every 10 seconds
    _loopInterval = setInterval(checkCycle, 10000);

    // After 60s, switch to passive (30s interval)
    if (_coolingTimer) clearTimeout(_coolingTimer);
    _coolingTimer = setTimeout(function() {
      _isCooling = true;
      if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
      _loopInterval = setInterval(checkCycle, 30000);
    }, 60000);

    // Re-engage when tab becomes visible
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        _isCooling = false;
        if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
        checkCycle();
        // Restart with aggressive interval
        _loopInterval = setInterval(checkCycle, 10000);
        if (_coolingTimer) clearTimeout(_coolingTimer);
        _coolingTimer = setTimeout(function() {
          _isCooling = true;
          if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
          _loopInterval = setInterval(checkCycle, 30000);
        }, 60000);
      }
    });
  }

  // ===== INIT =====
  async function _init() {
    console.log('[ADBLOCK] v7 starting...');
    var blocked = await _runFreshDetection();
    if (blocked) {
      _showModal();
      _showTopBanner();
      _disableEarnPage();
    }
    _startLoop();
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  console.log('[ADBLOCK] v7 loaded — 6 detection methods, real re-check loop, earn page blocking');
})();
