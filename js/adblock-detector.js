// =============================================
// EARNNOVA — AdBlock Detector v4
// Reliable detection for uBlock/AdBlock/AdBlock+
// =============================================

var AdBlockDetector = {
  _blocked: false,
  _checked: false,
  _callbacks: [],

  detect: function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._checked) { resolve(self._blocked); return; }

      var blocked = false;
      var checksDone = 0;
      var totalChecks = 5;

      function oneCheck() {
        checksDone++;
        if (checksDone >= totalChecks) {
          self._blocked = blocked;
          self._checked = true;
          console.log('[ADBLOCK] Detection complete — blocked:', blocked);
          resolve(blocked);
          self._callbacks.forEach(function(cb) { cb(blocked); });
        }
      }

      function markBlocked() {
        blocked = true;
      }

      // === CHECK 1: Multiple bait elements with ad classes ===
      try {
        var classes = [
          'adsbox', 'pub_300x250', 'pub_728x90', 'text_ad', 'text-ad',
          'ad-container', 'advertisement', 'ad-space', 'ad-unit',
          'google_ads', 'adsbygoogle', 'ad_slot', 'adbox'
        ];
        var baits = [];
        classes.forEach(function(cls) {
          var el = document.createElement('div');
          el.className = cls;
          el.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
          document.body.appendChild(el);
          baits.push(el);
        });

        setTimeout(function() {
          baits.forEach(function(el) {
            try {
              if (!document.body.contains(el)) { markBlocked(); }
              else {
                var s = window.getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden' || 
                    parseFloat(s.height) < 1 || parseFloat(s.width) < 1) {
                  markBlocked();
                }
              }
              if (document.body.contains(el)) document.body.removeChild(el);
            } catch(e) {}
          });
          oneCheck();
        }, 200);
      } catch(e) { oneCheck(); }

      // === CHECK 2: Detect by checking if Google AdSense script was blocked ===
      try {
        var scriptTest = document.createElement('script');
        scriptTest.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        scriptTest.async = true;
        scriptTest.onerror = function() { 
          markBlocked();
          oneCheck();
        };
        scriptTest.onload = function() { 
          // Script loaded — check if adsbygoogle exists
          setTimeout(function() {
            if (typeof adsbygoogle === 'undefined') markBlocked();
            oneCheck();
          }, 300);
        };
        document.head.appendChild(scriptTest);
        // Safety timeout
        setTimeout(function() {
          if (typeof adsbygoogle === 'undefined') markBlocked();
          oneCheck();
        }, 3000);
      } catch(e) { oneCheck(); }

      // === CHECK 3: XMLHttpRequest to ad domain ===
      // XHR is more reliable than fetch for detection
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', true);
        xhr.timeout = 2000;
        xhr.onload = function() { oneCheck(); };
        xhr.onerror = function() { markBlocked(); oneCheck(); };
        xhr.ontimeout = function() { oneCheck(); };
        xhr.send();
      } catch(e) { oneCheck(); }

      // === CHECK 4: Image test to multiple ad domains ===
      var adUrls = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://ad.doubleclick.net/ddm/trackimp/',
        'https://www.googletagservices.com/tag/js/gpt.js',
        'https://googleads.g.doubleclick.net/pagead/id'
      ];
      var imgChecksDone = 0;
      var imgTotal = adUrls.length;
      
      adUrls.forEach(function(url) {
        try {
          var img = new Image();
          var to = setTimeout(function() { img.src = ''; imgOnResult(); }, 2000);
          function imgOnResult() {
            clearTimeout(to);
            imgChecksDone++;
            if (imgChecksDone >= imgTotal) oneCheck();
          }
          img.onload = function() { imgOnResult(); };
          img.onerror = function() { markBlocked(); imgOnResult(); };
          img.src = url;
        } catch(e) {
          imgChecksDone++;
          if (imgChecksDone >= imgTotal) oneCheck();
        }
      });

      // === CHECK 5: Iframe to doubleclick ===
      try {
        var ifr = document.createElement('iframe');
        ifr.src = 'https://ad.doubleclick.net/';
        ifr.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
        ifr.onload = function() { oneCheck(); };
        ifr.onerror = function() { markBlocked(); oneCheck(); };
        document.body.appendChild(ifr);
        setTimeout(function() {
          if (document.body.contains(ifr)) {
            try {
              // If iframe loaded but we can't access content, it might be blocked
              if (ifr.contentDocument || ifr.contentWindow) { /* loaded */ }
              else { markBlocked(); }
            } catch(e) { markBlocked(); } // cross-origin error = blocked
          }
          if (document.body.contains(ifr)) document.body.removeChild(ifr);
          oneCheck();
        }, 1000);
      } catch(e) { oneCheck(); }

      // Safety: finish after 4s max
      setTimeout(function() {
        if (!self._checked) {
          self._blocked = blocked;
          self._checked = true;
          console.log('[ADBLOCK] Timeout — blocked:', blocked);
          resolve(blocked);
          self._callbacks.forEach(function(cb) { cb(blocked); });
        }
      }, 4000);
    });
  },

  onDetect: function(cb) {
    this._callbacks.push(cb);
    if (this._checked) cb(this._blocked);
  },

  showWarning: function() {
    var self = this;
    this.detect().then(function(blocked) {
      if (blocked) {
        self._injectWarning();
        // Also block the earn page from working
        self._blockEarnPage();
      }
    });
  },

  _injectWarning: function() {
    if (document.getElementById('adblockWarning')) return;
    
    var warn = document.createElement('div');
    warn.id = 'adblockWarning';
    warn.style.cssText = 
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:linear-gradient(135deg,#dc2626,#991b1b);' +
      'padding:14px 16px;text-align:center;' +
      'animation:slideDown 0.5s ease;' +
      'box-shadow:0 4px 24px rgba(220,38,38,0.4)';
    
    warn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;max-width:600px;margin:0 auto">' +
        '<span style="font-size:24px">&#128683;</span>' +
        '<div style="text-align:left">' +
          '<div style="color:white;font-weight:700;font-size:14px">Ad Blocker Detected!</div>' +
          '<div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px">Please disable ad blocker to earn rewards — ads fund the platform</div>' +
        '</div>' +
        '<button id="adblockDismissBtn" style="padding:8px 20px;border-radius:20px;background:white;color:#dc2626;border:none;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">Got it &#10005;</button>' +
      '</div>';
    
    document.body.insertBefore(warn, document.body.firstChild);
    document.getElementById('adblockDismissBtn').addEventListener('click', function() {
      var el = document.getElementById('adblockWarning');
      if (el) el.remove();
    });
  },

  _blockEarnPage: function() {
    // Add a persistent blocker on the earn page
    var checkInterval = setInterval(function() {
      var earnPage = document.getElementById('pageEarn');
      var watchBtn = document.getElementById('watchAdBtn');
      
      if (earnPage && !document.getElementById('adblockEarnBlock')) {
        var block = document.createElement('div');
        block.id = 'adblockEarnBlock';
        block.style.cssText = 
          'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);' +
          'border-radius:16px;padding:20px;text-align:center;margin:12px 0;' +
          'animation:fadeIn 0.5s ease';
        block.innerHTML =
          '<div style="font-size:32px;margin-bottom:8px">&#128683;</div>' +
          '<div style="font-size:14px;font-weight:700;color:#ef4444;margin-bottom:4px">Ad Blocker Active</div>' +
          '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px">Disable your ad blocker to watch ads and earn rewards</div>' +
          '<div style="font-size:10px;color:var(--text-muted)">Ad revenue supports free access for all users</div>';
        
        // Find the watch button
        var watchBtn2 = earnPage.querySelector('.btn-ad') || earnPage.querySelector('[onclick*="watchAd"]');
        
        if (watchBtn2 && watchBtn2.parentNode) {
          watchBtn2.parentNode.insertBefore(block, watchBtn2);
        } else {
          earnPage.insertBefore(block, earnPage.firstChild);
        }
        
        // Disable the watch button
        if (watchBtn2) {
          watchBtn2.disabled = true;
          watchBtn2.style.opacity = '0.4';
          watchBtn2.style.cursor = 'not-allowed';
          watchBtn2.title = 'Disable ad blocker to earn';
        }
      }
      
      // Keep checking until adblock is off
      if (!AdBlockDetector._blocked) {
        clearInterval(checkInterval);
      }
    }, 2000);
  }
};

// Auto-run
if (document.readyState === 'complete') {
  AdBlockDetector.showWarning();
} else {
  window.addEventListener('load', function() { AdBlockDetector.showWarning(); });
}

console.log('[ADBLOCK] v4 loaded — 5 detection methods, earn page blocked when adblock active');
