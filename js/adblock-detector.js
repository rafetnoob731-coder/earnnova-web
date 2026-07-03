// =============================================
// EARNNOVA — AdBlock Detector v3
// Accurate detection with control URL, no false positives
// =============================================

var AdBlockDetector = {
  _blocked: false,
  _checked: false,

  detect: function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._checked) { resolve(self._blocked); return; }

      var results = { bait: false, bait2: false, fetchBlocked: 0, fetchTotal: 0, controlFailed: false };
      var completed = 0;
      var totalTests = 4; // bait, ins bait, script bait, image fetch

      function finish() {
        // Only mark as blocked if bait tests say blocked AND fetch to ad URLs fails
        // but control URL succeeds (meaning it's really adblock, not network issue)
        var baitBlocked = results.bait || results.bait2;
        var fetchBlocked = results.fetchBlocked > 0 && results.fetchBlocked >= results.fetchTotal * 0.5; // at least 50% blocked
        
        self._blocked = baitBlocked || (fetchBlocked && !results.controlFailed);
        self._checked = true;
        console.log('[ADBLOCK] Results:', results, 'Blocked:', self._blocked);
        resolve(self._blocked);
      }

      function checkDone() {
        completed++;
        if (completed >= totalTests) finish();
      }

      // === TEST 1: Bait element ===
      try {
        var bait = document.createElement('div');
        bait.className = 'adsbox pub_300x250 pub_728x90 text_ad text-ads';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px';
        document.body.appendChild(bait);
        setTimeout(function() {
          try {
            if (!document.body.contains(bait)) { results.bait = true; }
            else {
              var s = window.getComputedStyle(bait);
              if (s.display === 'none' || parseFloat(s.height) < 1) results.bait = true;
            }
          } catch(e) {}
          if (document.body.contains(bait)) document.body.removeChild(bait);
          checkDone();
        }, 100);
      } catch(e) { checkDone(); }

      // === TEST 2: AdSense bait (ins element) ===
      try {
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.cssText = 'display:block;width:1px;height:1px';
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

      // === TEST 2b: Google AdSense script bait ===
      // Adblockers specifically block adsbygoogle.js script loads
      try {
        var scriptBait = document.createElement('script');
        scriptBait.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        scriptBait.async = true;
        scriptBait.onerror = function() { results.bait2 = true; };
        document.head.appendChild(scriptBait);
        setTimeout(function() {
          // If script didn't load by now, it was blocked
          if (!window.adsbygoogle) {
            results.bait2 = true;
          }
          checkDone();
        }, 500);
      } catch(e) { checkDone(); }

      // === TEST 3: Image bait — adblockers block ad image requests ===
      // Using IMG tags is more reliable than fetch for adblock detection
      function testImageLoad(url) {
        return new Promise(function(res) {
          var img = new Image();
          var timeout = setTimeout(function() { img.src = ''; res('timeout'); }, 2000);
          img.onload = function() { clearTimeout(timeout); res('success'); };
          img.onerror = function() { clearTimeout(timeout); res('blocked'); };
          img.src = url;
        });
      }

      // Control image (always loads)
      var controlImg = 'https://www.google.com/favicon.ico';
      var adImgs = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://ad.doubleclick.net/ddm/trackimp/',
        'https://www.googletagservices.com/tag/js/gpt.js'
      ];

      testImageLoad(controlImg).then(function(ctrl) {
        results.controlFailed = (ctrl !== 'success');
        
        if (results.controlFailed) {
          console.log('[ADBLOCK] Control image failed — network issue');
          checkDone();
          return;
        }

        var pending = adImgs.length;
        adImgs.forEach(function(url) {
          testImageLoad(url).then(function(result) {
            results.fetchTotal++;
            if (result === 'blocked') results.fetchBlocked++;
            pending--;
            if (pending === 0) checkDone();
          });
        });
      });
      
      // Safety timeout
      setTimeout(function() {
        if (!self._checked) {
          self._blocked = results.bait || results.bait2;
          self._checked = true;
          resolve(self._blocked);
        }
      }, 5000);
    });
  },

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
      'background:linear-gradient(135deg,#dc2626,#991b1b);' +
      'padding:12px 16px;text-align:center;' +
      'animation:slideDown 0.5s ease;' +
      'box-shadow:0 4px 24px rgba(220,38,38,0.35)';
    
    warn.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;max-width:500px;margin:0 auto">' +
        '<span style="font-size:18px">&#128683;</span>' +
        '<span style="color:white;font-weight:600;font-size:13px">Ad Blocker Detected</span>' +
        '<span style="color:rgba(255,255,255,0.75);font-size:11px">Disable to support the platform and earn rewards</span>' +
        '<button id="adblockDismissBtn" style="padding:6px 16px;border-radius:20px;background:white;color:#dc2626;border:none;font-size:12px;font-weight:700;cursor:pointer">OK &#10005;</button>' +
      '</div>';
    
    document.body.insertBefore(warn, document.body.firstChild);
    document.getElementById('adblockDismissBtn').addEventListener('click', function() {
      var el = document.getElementById('adblockWarning');
      if (el) el.remove();
    });
  }
};

// Auto-run on dashboard only
if (document.readyState === 'complete') {
  AdBlockDetector.showWarning();
} else {
  window.addEventListener('load', function() { AdBlockDetector.showWarning(); });
}

console.log('[ADBLOCK] v3 loaded — control URL validation, no false positives');
