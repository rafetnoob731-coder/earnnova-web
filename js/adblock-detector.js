// =============================================
// EARNNOVA — Advanced AdBlock Detector v6
// Integrated techniques from:
//   - Simple-Adblock-Detector (fetch + ID checks)
//   - Aggressive-Anti-AdBlock (multi-vector + persistence)
//   - 103-early-anti-adblock (early detection concepts)
// =============================================

var AdBlockDetector = (function() {
  var _blocked = false;
  var _checked = false;
  var _callbacks = [];
  var _warningActive = false;
  var _coolingTimer = null;
  var _isCooling = false;
  var _loopInterval = null;

  // ===== DETECTION METHODS =====

  // 1. FETCH-BASED: Test loading ad URLs (from Simple-Adblock-Detector)
  async function _fetchTest(url, opts) {
    try {
      var resp = await fetch(url, opts || { mode: 'no-cors' });
      await resp.text();
      return false; // loaded = no adblock
    } catch(e) {
      return true; // blocked = adblock
    }
  }

  // 2. BAIT ELEMENT DETECTION (from Aggressive-Anti-AdBlock)
  function _baitTest() {
    var classes = [
      'adsbox', 'pub_300x250', 'pub_728x90', 'text_ad', 'text-ad',
      'ad-container', 'advertisement', 'ad-space', 'ad-unit',
      'google_ads', 'adsbygoogle', 'ad_slot', 'adbox',
      'sponsored-ad', 'ad-banner'
    ];
    var hidden = 0;
    var baits = [];

    classes.forEach(function(cls) {
      var el = document.createElement('div');
      el.className = cls;
      el.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;height:1px!important;width:1px!important;position:absolute!important;left:-10000px!important;top:-10000px!important';
      document.body.appendChild(el);
      baits.push(el);
    });

    // Also add AdSense ins bait
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.id = 'bait_adsense_' + Math.random().toString(36).substr(2,5);
    ins.style.cssText = 'display:block!important;height:1px!important;width:1px!important;position:absolute!important;left:-10000px!important;top:-10000px!important';
    document.body.appendChild(ins);
    baits.push(ins);

    // Check after a tick
    var result = false;
    baits.forEach(function(el) {
      try {
        if (!document.body.contains(el)) { hidden++; }
        else {
          var s = window.getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || 
              parseFloat(s.height) < 1 || parseFloat(s.width) < 1) { hidden++; }
        }
        if (document.body.contains(el)) document.body.removeChild(el);
      } catch(e) {}
    });

    return hidden >= 3; // 3+ hidden = adblock
  }

  // 3. AdSense SCRIPT LOAD TEST
  function _scriptTest() {
    return new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      s.async = true;
      var done = false;
      s.onload = function() {
        setTimeout(function() {
          resolve(typeof window.adsbygoogle === 'undefined');
        }, 200);
      };
      s.onerror = function() { if (!done) { done = true; resolve(true); } };
      document.head.appendChild(s);
      setTimeout(function() { if (!done) { done = true; resolve(typeof window.adsbygoogle === 'undefined'); } }, 2000);
    });
  }

  // 4. XHR TO AD DOMAIN
  function _xhrTest() {
    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', true);
        xhr.timeout = 2000;
        xhr.onload = function() { resolve(false); };
        xhr.onerror = function() { resolve(true); };
        xhr.ontimeout = function() { resolve(false); };
        xhr.send();
      } catch(e) { resolve(false); }
    });
  }

  // 5. IMAGE TEST TO MULTIPLE AD DOMAINS
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
          var to = setTimeout(function() { img.src = ''; done++; if (done >= urls.length) resolve(blocked >= 2); }, 2000);
          img.onload = function() { clearTimeout(to); done++; if (done >= urls.length) resolve(blocked >= 2); };
          img.onerror = function() { clearTimeout(to); blocked++; done++; if (done >= urls.length) resolve(blocked >= 2); };
          img.src = url;
        } catch(e) { done++; if (done >= urls.length) resolve(blocked >= 2); }
      });
    });
  }

  // 6. setInterval MANIPULATION CHECK (from Simple-Adblock-Detector)
  function _intervalTest() {
    return new Promise(function(resolve) {
      var timeout = setTimeout(function() { resolve(true); }, 1500);
      var interval = setInterval(function() {
        var a = 'test';
        if (a === 'test') {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(false);
        }
      }, 50);
    });
  }

  // 7. FETCH MULTIPLE AD DOMAINS (from Simple-Adblock-Detector)
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

  // 8. CONTROL TEST - google.com favicon
  function _controlTest() {
    return new Promise(function(resolve) {
      try {
        var img = new Image();
        var t = setTimeout(function() { img.src = ''; resolve(false); }, 2000);
        img.onload = function() { clearTimeout(t); resolve(true); };
        img.onerror = function() { clearTimeout(t); resolve(false); };
        img.src = 'https://www.google.com/favicon.ico';
      } catch(e) { resolve(false); }
    });
  }

  // ===== MAIN DETECTION =====
  async function _runDetection() {
    if (_checked) return _blocked;

    // First check control (network working?)
    var controlOk = await _controlTest();
    if (!controlOk) {
      // Network issue - can't reliably detect
      _checked = true;
      _blocked = false;
      return false;
    }

    // Run all tests in parallel
    var results = await Promise.all([
      _scriptTest(),
      _xhrTest(),
      _imageTest(),
      _intervalTest(),
      _fetchMultiTest()
    ]);

    // Bait test is synchronous
    var baitResult = _baitTest();

    // Count how many tests detected adblock
    var detections = (baitResult ? 1 : 0) + results.filter(function(r) { return r; }).length;

    // If 3+ out of 6 tests say blocked, it's adblock
    _blocked = detections >= 3;
    _checked = true;

    console.log('[ADBLOCK] v6 results:', {
      bait: baitResult,
      script: results[0],
      xhr: results[1],
      image: results[2],
      interval: results[3],
      fetch: results[4],
      total: detections + '/6',
      blocked: _blocked
    });

    return _blocked;
  }

  // ===== PUBLIC API =====
  return {
    detect: function() {
      var self = this;
      return new Promise(function(resolve) {
        if (_checked) { resolve(_blocked); return; }
        _runDetection().then(function(result) {
          resolve(result);
          _callbacks.forEach(function(cb) { cb(result); });
        });
      });
    },

    onDetect: function(cb) {
      _callbacks.push(cb);
      if (_checked) cb(_blocked);
    },

    showWarning: function() {
      var self = this;
      this.detect().then(function(blocked) {
        if (blocked) {
          self._injectWarning();
          self._startAggressiveLoop();
        }
      });
    },

    _injectWarning: function() {
      if (_warningActive) return;
      _warningActive = true;

      // Check if modal already exists
      var existing = document.querySelector('[id^="adb-modal-"]');
      if (existing) return;

      var modalId = 'adb-modal-' + Math.random().toString(36).substr(2, 8);
      var modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 
        'position:fixed!important;top:0!important;left:0!important;width:100%!important;' +
        'height:100%!important;background:rgba(0,0,0,0.55)!important;' +
        'z-index:99999!important;display:flex!important;align-items:center!important;' +
        'justify-content:center!important;flex-direction:column!important;' +
        'backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important';

      modal.innerHTML =
        '<div style="max-width:380px;width:90%;padding:24px;background:linear-gradient(135deg,#1a1a2e,#0F172A);border-radius:20px;border:2px solid rgba(239,68,68,0.3);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5)">' +
          '<div style="font-size:48px;margin-bottom:12px">🚫</div>' +
          '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:6px">Ad Blocker Detected!</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:16px;line-height:1.5">Please disable your ad blocker to continue earning. Ads fund the platform and allow free access for all users.</div>' +
          '<div style="background:rgba(239,68,68,0.1);border-radius:12px;padding:12px;margin-bottom:16px">' +
            '<div style="font-size:11px;color:#fca5a5">How to disable:</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">Click the adblock icon in your browser toolbar → Pause/Disable on this site → Refresh</div>' +
          '</div>' +
          '<button onclick="this.closest(\'[id^=\\"adb-modal-\\"]\').remove();_warningActive=false" style="padding:12px 32px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">I Understand ✕</button>' +
        '</div>';

      document.body.appendChild(modal);
    },

    _startAggressiveLoop: function() {
      var self = this;

      // Periodic check: every 10 seconds re-verify adblock status
      _loopInterval = setInterval(function() {
        if (_isCooling) return;

        // Refresh bait elements to catch dynamic blockers
        self._refreshBaits();

        // Re-check quickly
        _runDetection().then(function(blocked) {
          if (blocked) {
            self._injectWarning();
          } else {
            // User disabled adblock - remove warning
            var modal = document.querySelector('[id^="adb-modal-"]');
            if (modal) modal.remove();
            _warningActive = false;
            if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
          }
        });
      }, 10000);

      // Cooling: after 60s, slow down checks
      _coolingTimer = setTimeout(function() {
        _isCooling = true;
        if (_loopInterval) {
          clearInterval(_loopInterval);
          _loopInterval = null;
          // Resume passive mode - check every 30s
          _loopInterval = setInterval(function() {
            _runDetection().then(function(blocked) {
              if (blocked) self._injectWarning();
              else {
                var modal = document.querySelector('[id^="adb-modal-"]');
                if (modal) modal.remove();
                _warningActive = false;
              }
            });
          }, 30000);
        }
      }, 60000);

      // Tab visibility: re-engage aggressive when tab becomes active
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden && _checked && _blocked) {
          self._injectWarning();
        }
      });
    },

    _refreshBaits: function() {
      // Moving bait elements forces style re-evaluation
      var baits = document.querySelectorAll('.adsbygoogle, [class*="ad-"], [class*="ad_"]');
      baits.forEach(function(el) {
        if (el && el.isConnected && el.style.position === 'absolute') {
          document.body.appendChild(el);
        }
      });
    }
  };
})();

// Auto-run
if (document.readyState === 'complete') {
  AdBlockDetector.showWarning();
} else {
  window.addEventListener('load', function() { AdBlockDetector.showWarning(); });
}

console.log('[ADBLOCK] v6 loaded — 6 detection methods, aggressive loop, cooling system');
