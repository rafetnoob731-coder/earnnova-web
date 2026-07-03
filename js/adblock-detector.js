// =============================================
// EARNNOVA — AdBlock Detector
// Detects adblockers via bait element + fetch trap
// =============================================

var AdBlockDetector = {
  _blocked: false,
  _checked: false,
  _callbacks: [],

  // Run detection and return promise
  detect: function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._checked) {
        resolve(self._blocked);
        return;
      }

      var baitResult = false;
      var fetchResult = false;
      var finished = false;

      // Method 1: Bait element
      function checkBait() {
        var bait = document.createElement('div');
        bait.className = 'adsbox ad banner ad-container banner-ad sponsored';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
        bait.setAttribute('data-test', 'adblock-bait');
        document.body.appendChild(bait);

        var blocked = false;
        try {
          var exists = document.body.contains(bait);
          if (!exists) {
            blocked = true;
          } else {
            var style = window.getComputedStyle(bait);
            if (style.display === 'none' || parseFloat(style.height) < 1 || parseFloat(style.width) < 1) {
              blocked = true;
            }
          }
        } catch(e) {}
        
        if (document.body.contains(bait)) document.body.removeChild(bait);
        return blocked;
      }

      // Method 2: Fetch trap
      function checkFetch() {
        return new Promise(function(res) {
          var controller = new AbortController();
          var timeout = setTimeout(function() { controller.abort(); res(false); }, 2000);

          fetch('https://ad.doubleclick.net/ddm/trackimp/', {
            method: 'HEAD', mode: 'no-cors', signal: controller.signal, cache: 'no-store'
          }).then(function() {
            clearTimeout(timeout); res(false);
          }).catch(function(err) {
            clearTimeout(timeout);
            if (err.name !== 'AbortError') res(true);
            else res(false);
          });
        });
      }

      baitResult = checkBait();

      checkFetch().then(function(fetchBlocked) {
        fetchResult = fetchBlocked;
        self._blocked = baitResult || fetchResult;
        self._checked = true;
        finished = true;
        resolve(self._blocked);
        
        // Fire callbacks
        for (var i = 0; i < self._callbacks.length; i++) {
          self._callbacks[i](self._blocked);
        }
      });

      setTimeout(function() {
        if (!finished) {
          self._blocked = baitResult;
          self._checked = true;
          resolve(self._blocked);
          for (var i = 0; i < self._callbacks.length; i++) {
            self._callbacks[i](self._blocked);
          }
        }
      }, 3000);
    });
  },

  // Register callback for when detection completes
  onDetect: function(cb) {
    this._callbacks.push(cb);
    if (this._checked) {
      cb(this._blocked);
    }
  },

  // Show warning banner if adblock detected
  showWarning: function() {
    var self = this;
    this.detect().then(function(blocked) {
      if (blocked) {
        self._injectWarning();
      }
    });
  },

  _injectWarning: function() {
    if (document.getElementById('adblockWarning')) return;
    
    var warn = document.createElement('div');
    warn.id = 'adblockWarning';
    warn.style.cssText = 
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:linear-gradient(135deg,#dc2626,#b91c1c);' +
      'padding:12px 16px;text-align:center;' +
      'animation:slideDown 0.4s ease;' +
      'box-shadow:0 4px 20px rgba(220,38,38,0.3)';
    warn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap">' +
        '<span style="font-size:20px">🚫</span>' +
        '<span style="color:white;font-weight:600;font-size:14px">Ad Blocker Detected!</span>' +
        '<span style="color:rgba(255,255,255,0.85);font-size:12px">Please disable ad blocker to earn rewards. Ads support the platform.</span>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="padding:6px 16px;border-radius:20px;background:white;color:#dc2626;border:none;font-size:12px;font-weight:700;cursor:pointer">Got it ✕</button>' +
      '</div>';
    
    document.body.insertBefore(warn, document.body.firstChild);
  }
};

// Auto-run on load
if (document.readyState === 'complete') {
  AdBlockDetector.showWarning();
} else {
  window.addEventListener('load', function() { AdBlockDetector.showWarning(); });
}

console.log('[ADBLOCK] ✅ Detector loaded');
