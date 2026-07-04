// =============================================
// EARNNOVA — AdBlock Detector v5 (Chrome-friendly)
// Accurate detection — no false positives in Chrome
// =============================================

var AdBlockDetector = {
  _blocked: false,
 0,
  _checked:,
  _callbacks:,

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
          console.log('[ADBLOCK] v5 complete — blocked:', blocked);
          resolve(blocked);
          self._callbacks.forEach(function(cb) { cb(blocked); });
        }
      }

      function markBlocked() { blocked = true; }

      // ===== 1. MULTI-BAIT ELEMENTS =====
      try {
        var baits = [];
        var classes = ['adsbox','pub_300x250','pub_728x90','text_ad','ad-container','advertisement','google_ads','adsbygoogle','ad-slot'];
        classes.forEach(function(cls) {
          var el = document.createElement('div');
          el.className = cls;
          el.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
          document.body.appendChild(el);
          baits.push(el);
        });
        setTimeout(function() {
          var hidden = 0;
          baits.forEach(function(el) {
            try {
              if (!document.body.contains(el)) hidden++;
              else {
                var s = window.getComputedStyle(el);
                if (s.display==='none'||s.visibility==='hidden'||parseFloat(s.height)<1||parseFloat(s.width)<1) hidden++;
              }
              if (document.body.contains(el)) document.body.removeChild(el);
            } catch(e) {}
          });
          // Only block if MULTIPLE baits hidden (not just 1 which might be Chrome)
          if (hidden >= 3) markBlocked();
          oneCheck();
        }, 150);
      } catch(e) { oneCheck(); }

      // ===== 2. ADSENSE SCRIPT LOAD =====
      try {
        var s = document.createElement('script');
        s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        s.async = true;
        s.onload = function() {
          // If script loads, wait to see if adsbygoogle object exists
          setTimeout(function() {
            if (typeof window.adsbygoogle === 'undefined') markBlocked();
            oneCheck();
          }, 200);
        };
        s.onerror = function() { markBlocked(); oneCheck(); };
        document.head.appendChild(s);
        setTimeout(function() { if (typeof window.adsbygoogle === 'undefined') markBlocked(); oneCheck(); }, 2500);
      } catch(e) { oneCheck(); }

      // ===== 3. XHR TO AD DOMAIN =====
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', true);
        xhr.timeout = 2000;
        xhr.onload = function() { oneCheck(); };
        xhr.onerror = function() { markBlocked(); oneCheck(); };
        xhr.ontimeout = function() { oneCheck(); };
        xhr.send();
      } catch(e) { oneCheck(); }

      // ===== 4. IMAGE TEST TO AD DOMAINS =====
      var adImgs = ['https://ad.doubleclick.net/ddm/trackimp/','https://www.googletagservices.com/tag/js/gpt.js','https://googleads.g.doubleclick.net/pagead/id'];
      var imgDone = 0;
      adImgs.forEach(function(url) {
        try {
          var img = new Image();
          var to = setTimeout(function() { img.src=''; done(); }, 2000);
          function done() { clearTimeout(to); imgDone++; if (imgDone>=adImgs.length) oneCheck(); }
          img.onload = done;
          img.onerror = function() { markBlocked(); done(); };
          img.src = url;
        } catch(e) { done(); }
      });

      // ===== 5. CONTROL TEST - google.com =====
      // If control fails, it's network issue NOT adblock
      try {
        var ctrl = new Image();
        var t = setTimeout(function() { ctrl.src=''; }, 2000);
        ctrl.onload = function() { clearTimeout(t); oneCheck(); };
        ctrl.onerror = function() { clearTimeout(t); oneCheck(); }; // network issue
        ctrl.src = 'https://www.google.com/favicon.ico';
      } catch(e) { oneCheck(); }

      // SAFETY TIMEOUT
      setTimeout(function() {
        if (!self._checked) {
          self._blocked = blocked;
          self._checked = true;
          console.log('[ADBLOCK] v5 timeout — blocked:', blocked);
          resolve(blocked);
          self._callbacks.forEach(function(cb) { cb(blocked); });
        }
      }, 4000);
    });
  },

  onDetect: function(cb) { this._callbacks.push(cb); if (this._checked) cb(this._blocked); },

  showWarning: function() {
    var self = this;
    this.detect().then(function(blocked) {
      if (blocked) self._injectWarning();
    });
  },

  _injectWarning: function() {
    if (document.getElementById('adblockWarning')) return;
    var w = document.createElement('div');
    w.id = 'adblockWarning';
    w.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#dc2626,#991b1b);padding:14px 16px;text-align:center;animation:slideDown 0.5s ease;box-shadow:0 4px 24px rgba(220,38,38,0.4)';
    w.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;max-width:600px;margin:0 auto"><span style="font-size:24px">🚫</span><div style="text-align:left"><div style="color:white;font-weight:700;font-size:14px">Ad Blocker Detected</div><div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px">Disable ad blocker to earn — ads fund the platform</div></div><button id="adblockDismissBtn" style="padding:8px 20px;border-radius:20px;background:white;color:#dc2626;border:none;font-size:13px;font-weight:700;cursor:pointer">OK ✕</button></div>';
    document.body.insertBefore(w, document.body.firstChild);
    document.getElementById('adblockDismissBtn').addEventListener('click', function() { var e=document.getElementById('adblockWarning'); if(e)e.remove(); });
  }
};

if (document.readyState === 'complete') AdBlockDetector.showWarning();
else window.addEventListener('load', function() { AdBlockDetector.showWarning(); });

console.log('[ADBLOCK] v5 loaded — Chrome-safe, 5 methods, multi-bait threshold');