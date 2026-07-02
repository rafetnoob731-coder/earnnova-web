// =============================================
// EARNNOVA — LIVE Ad Network Integration
// AdSense · EffectiveCPM · HighPerformance · Rewarded
// =============================================

// ===== 1. GOOGLE ADSENSE =====
(function() {
  var script = document.createElement('script');
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9307459733796967';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.onerror = function() { console.warn('AdSense failed'); };
  document.head.appendChild(script);
})();

// ===== 2. EFFECTIVE CPM NETWORK (pl29828442) =====
(function() {
  var s = document.createElement('script');
  s.src = 'https://pl29828442.effectivecpmnetwork.com/2e/83/ea/2e83eab240b4afc016ede828af8a897a.js';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 3. EFFECTIVE CPM NETWORK (pl29828443) with container =====
(function() {
  var container = document.createElement('div');
  container.id = 'container-ac40f76d59b8e8c281fb380b91c2bf21';
  container.style.display = 'none'; // Hidden by default, network controls visibility
  document.body.appendChild(container);

  var s = document.createElement('script');
  s.src = 'https://pl29828443.effectivecpmnetwork.com/ac40f76d59b8e8c281fb380b91c2bf21/invoke.js';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.body.appendChild(s);
})();

// ===== 4. HIGH PERFORMANCE FORMAT — 300x160 =====
(function() {
  window.atOptions = window.atOptions || {};
  window.atOptions['679c41f5cd1133dfcfb8ddd3254605d4'] = {
    'key': '679c41f5cd1133dfcfb8ddd3254605d4',
    'format': 'iframe',
    'height': 300,
    'width': 160,
    'params': {}
  };
  var s = document.createElement('script');
  s.src = 'https://www.highperformanceformat.com/679c41f5cd1133dfcfb8ddd3254605d4/invoke.js';
  document.head.appendChild(s);
})();

// ===== 5. HIGH PERFORMANCE FORMAT — 468x60 =====
(function() {
  window.atOptions = window.atOptions || {};
  window.atOptions['11127fe81ff9922c5ece58925c849fd8'] = {
    'key': '11127fe81ff9922c5ece58925c849fd8',
    'format': 'iframe',
    'height': 60,
    'width': 468,
    'params': {}
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
  s.dataset.zone = '255448';
  s.async = true;
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
})();

// ===== 8. EFFECTIVE CPM NETWORK — Direct URL =====
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.effectivecpmnetwork.com/zjzbzfk7?key=5be534a9c13e9ed7a663c6cc527b5b74';
  iframe.style.cssText = 'width:300px;height:250px;border:none;overflow:hidden;display:block;margin:0 auto';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowtransparency', 'true');
  
  // Insert into ad container when ready
  var insertAd = function() {
    var container = document.getElementById('adNetworkContainer') || document.body;
    container.appendChild(iframe);
  };
  
  if (document.readyState === 'complete') insertAd();
  else window.addEventListener('load', insertAd);
})();

// ===== 9. REWARDED INTERSTITIAL AD =====
var RewardedAd = {
  _ready: false,
  
  init: function() {
    // The rewarded ad script should define show_9622450()
    if (typeof show_9622450 !== 'undefined') {
      this._ready = true;
      console.log('✅ Rewarded ad ready');
    } else {
      // Poll for the function
      var check = setInterval(function() {
        if (typeof show_9622450 !== 'undefined') {
          RewardedAd._ready = true;
          clearInterval(check);
          console.log('✅ Rewarded ad ready');
        }
      }, 500);
      setTimeout(function() { clearInterval(check); }, 15000);
    }
  },
  
  show: function(callback) {
    callback = callback || function(){};
    
    if (this._ready && typeof show_9622450 !== 'undefined') {
      show_9622450().then(function() {
        callback(true);
      }).catch(function(err) {
        console.warn('Rewarded ad error:', err);
        callback(false);
      });
    } else {
      console.warn('Rewarded ad not ready, using fallback');
      callback(false);
    }
  }
};

// ===== AD NETWORK MANAGER =====
var AdNetwork = {
  // Initialize everything
  init: function() {
    console.log('📢 EARNNOVA Ad Networks: Loading...');
    
    // Give networks time to load
    setTimeout(function() {
      RewardedAd.init();
    }, 2000);
    
    // Create ad containers on the page
    this.createAdSpaces();
  },
  
  // Create ad placement containers
  createAdSpaces: function() {
    // Main container
    var container = document.createElement('div');
    container.id = 'adNetworkContainer';
    container.style.cssText = 'width:100%;max-width:480px;margin:12px auto;min-height:60px;display:flex;flex-direction:column;align-items:center;gap:10px';
    
    var mainContent = document.querySelector('.main-content');
    if (mainContent) {
      // Top banner ad
      var topAd = document.getElementById('adTopBanner') || document.createElement('div');
      topAd.id = 'adTopBanner';
      topAd.style.cssText = 'width:100%;min-height:60px;margin-bottom:12px;display:flex;justify-content:center';
      mainContent.insertBefore(topAd, mainContent.firstChild);
      
      // Bottom ad area
      var bottomAd = document.getElementById('adBottomBanner') || document.createElement('div');
      bottomAd.id = 'adBottomBanner';
      bottomAd.style.cssText = 'width:100%;min-height:90px;margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:8px';
      mainContent.appendChild(bottomAd);
      
      // High performance 300x160 ad in top banner
      var hp1 = document.createElement('div');
      hp1.id = 'hpf-slot-1';
      hp1.style.cssText = 'margin:4px auto';
      topAd.appendChild(hp1);
      
      // High performance 468x60 ad in bottom
      var hp2 = document.createElement('div');
      hp2.id = 'hpf-slot-2';
      hp2.style.cssText = 'margin:4px auto';
      bottomAd.appendChild(hp2);
    }
  },
  
  // Show interstitial (before ad watch)
  showInterstitial: function(callback) {
    callback = callback || function(){};
    
    // Try rewarded ad first
    if (RewardedAd._ready) {
      RewardedAd.show(function(success) {
        if (success) {
          // User watched rewarded ad - proceed to timer
          callback();
        } else {
          // Fallback to regular interstitial
          AdNetwork._showFallbackInterstitial(callback);
        }
      });
    } else {
      AdNetwork._showFallbackInterstitial(callback);
    }
  },
  
  // Fallback interstitial overlay
  _showFallbackInterstitial: function(callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
    overlay.innerHTML = 
      '<div style="background:rgba(16,24,40,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px 24px;text-align:center;max-width:300px;width:90%">' +
        '<div style="font-size:48px;margin-bottom:12px">📢</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:4px">Sponsored</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Support us by viewing this ad</div>' +
        '<div id="interstitialTimer" style="font-size:32px;font-weight:800;color:var(--gold);margin-bottom:16px">5</div>' +
        '<button id="interstitialSkipBtn" style="padding:12px 32px;border-radius:10px;background:var(--gold);color:#0A0E1A;border:none;font-size:15px;font-weight:700;cursor:pointer;opacity:0.5;transition:all 0.3s" disabled>Skip</button>' +
      '</div>';
    overlay.setAttribute('data-ad-overlay', '');
    document.body.appendChild(overlay);
    
    // Countdown then enable skip
    var count = 5;
    var timer = setInterval(function() {
      count--;
      var t = document.getElementById('interstitialTimer');
      if (t) t.textContent = count;
      
      if (count <= 0) {
        clearInterval(timer);
        var btn = document.getElementById('interstitialSkipBtn');
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.textContent = 'Continue →';
          btn.onclick = function() {
            overlay.remove();
            callback();
          };
        }
      }
    }, 1000);
    
    // Auto-close after 8s
    setTimeout(function() {
      overlay.remove();
      callback();
    }, 8000);
  }
};

// ===== AUTO-INIT =====
if (document.readyState === 'complete') {
  AdNetwork.init();
} else {
  window.addEventListener('load', function() { AdNetwork.init(); });
}

console.log('📢 EARNNOVA Ad Networks: Loaded');
