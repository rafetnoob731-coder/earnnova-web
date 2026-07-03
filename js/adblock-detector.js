// =============================================
// EARNNOVA — AdBlock Detector v2
// Multi-method detection for accuracy
// =============================================

var AdBlockDetector = {
  _blocked: false,
  _checked: false,
  _callbacks: [],

  detect: function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._checked) {
        resolve(self._blocked);
        return;
      }

      var results = { bait: false, bait2: false, fetch: false, iframe: false };
      var completed = 0;
      var totalTests = 4;

      function checkDone() {
        completed++;
        if (completed >= totalTests) {
          self._blocked = results.bait || results.bait2 || results.fetch || results.iframe;
          self._checked = true;
          console.log('[ADBLOCK] Results:', results, 'Blocked:', self._blocked);
          resolve(self._blocked);
          for (var i = 0; i < self._callbacks.length; i++) {
            self._callbacks[i](self._blocked);
          }
        }
      }

      // TEST 1: Classic bait
      try {
        var bait = document.createElement('div');
        bait.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text_ad text_ads text-ads text-ad-links';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
        document.body.appendChild(bait);
        setTimeout(function() {
          try {
            if (!document.body.contains(bait)) { results.bait = true; }
            else {
              var s = window.getComputedStyle(bait);
              if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.height) < 1 || parseFloat(s.opacity || '1') < 0.1) {
                results.bait = true;
              }
            }
          } catch(e) {}
          if (document.body.contains(bait)) document.body.removeChild(bait);
          checkDone();
        }, 100);
      } catch(e) { checkDone(); }

      // TEST 2: Google AdSense bait
      try {
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.cssText = 'display:block;width:1px;height:1px';
        ins.dataset.adClient = 'ca-pub-9307459733796967';
        document.body.appendChild(ins);
        setTimeout(function() {
          try {
            if (!document.body.contains(ins)) { results.bait2 = true; }
            else {
              var s = window.getComputedStyle(ins);
              if (s.display === 'none' || parseFloat(s.height) < 1) results.bait2 = true;
            }
          } catch(e) {}
          if (document.body.contains(ins)) document.body.removeChild(ins);
          checkDone();
        }, 100);
      } catch(e) { checkDone(); }

      // TEST 3: Fetch traps
      var adUrls = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://ad.doubleclick.net/ddm/trackimp/',
        'https://www.googletagservices.com/tag/js/gpt.js'
      ];
      
      function tryFetch(url) {
        var controller = new AbortController();
        var timeout = setTimeout(function() { controller.abort(); }, 1500);
        return fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
          .then(function() { clearTimeout(timeout); return false; })
          .catch(function(err) { clearTimeout(timeout); if (err.name !== 'AbortError') return true; return false; });
      }

      (function runFetchTests() {
        var idx = 0;
        function next() {
          if (idx >= adUrls.length) { checkDone(); return; }
          tryFetch(adUrls[idx]).then(function(blocked) {
            if (blocked) results.fetch = true;
            idx++;
            next();
          });
        }
        next();
      })();

      // TEST 4: Iframe bait
      try {
        var ifr = document.createElement('iframe');
        ifr.src = 'https://ad.doubleclick.net/';
        ifr.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;display:none';
        document.body.appendChild(ifr);
        setTimeout(function() {
          try {
            if (!document.body.contains(ifr)) { results.iframe = true; }
            else {
              var s = window.getComputedStyle(ifr);
              if (s.display === 'none') results.iframe = true;
            }
          } catch(e) { results.iframe = true; }
          if (document.body.contains(ifr)) document.body.removeChild(ifr);
          checkDone();
        }, 500);
      } catch(e) { checkDone(); }

      // Safety timeout
      setTimeout(function() {
        if (!self._checked) {
          self._blocked = results.bait || results.bait2 || results.fetch || results.iframe;
          self._checked = true;
          console.log('[ADBLOCK] Timeout:', results, 'Blocked:', self._blocked);
          resolve(self._blocked);
          for (var i = 0; i < self._callbacks.length; i++) {
            self._callbacks[i](self._blocked);
          }
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
      } else {
        console.log('[ADBLOCK] No adblocker detected');
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
      'box-shadow:0 4px 24px rgba(220,38,38,0.35)';
    
    warn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;max-width:600px;margin:0 auto">' +
        '<span style="font-size:22px">&#128683;</span>' +
        '<div style="text-align:left">' +
          '<div style="color:white;font-weight:700;font-size:14px">Ad Blocker Detected!</div>' +
          '<div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:2px">Disable it to watch ads and earn rewards</div>' +
        '</div>' +
        '<button id="adblockDismissBtn" style="padding:8px 20px;border-radius:20px;background:white;color:#dc2626;border:none;font-size:13px;font-weight:700;cursor:pointer">Got it &#10005;</button>' +
      '</div>';
    
    document.body.insertBefore(warn, document.body.firstChild);
    
    // Dismiss handler
    document.getElementById('adblockDismissBtn').addEventListener('click', function() {
      var el = document.getElementById('adblockWarning');
      if (el) el.remove();
    });
    
    // Also add persistent note on earn page
    setTimeout(function() {
      var earnPage = document.getElementById('pageEarn');
      if (earnPage && !document.getElementById('adblockEarnNote')) {
        var note = document.createElement('div');
        note.id = 'adblockEarnNote';
        note.style.cssText = 'background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);border-radius:12px;padding:12px;margin-bottom:12px;font-size:12px;color:#ef4444;text-align:center';
        note.innerHTML = '&#128683; Ad blocker active &mdash; disable to earn rewards';
        earnPage.insertBefore(note, earnPage.firstChild);
      }
    }, 1000);
    
    console.log('[ADBLOCK] Warning banner shown');
  }
};

// Auto-run
if (document.readyState === 'complete') {
  AdBlockDetector.showWarning();
} else {
  window.addEventListener('load', function() { AdBlockDetector.showWarning(); });
}

console.log('[ADBLOCK] Detector v2 loaded');
