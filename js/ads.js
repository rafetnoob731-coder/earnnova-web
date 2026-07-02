// =============================================
// EARNNOVA — Multi-Network Ad Integration
// AdMob · AdSense · Adsterra · Fallback
// =============================================

var AdNetwork = {
  // ===== NETWORK CONFIG =====
  // Enable/disable specific networks
  config: {
    adsense: {
      enabled: true,
      publisherId: 'pub-XXXXXXXXXXXXXXXX', // Replace with your AdSense ID
      slots: {
        banner: '1234567890',      // AdSense banner ad unit
        interstitial: '1234567891', // AdSense interstitial
        rewarded: '1234567892'     // AdSense rewarded
      }
    },
    adsterra: {
      enabled: true,
      token: 'YOUR_ADSTERRA_TOKEN', // Replace with your Adsterra token
      zones: {
        banner: 'ZONE_ID',
        popunder: 'ZONE_ID_POP',
        social: 'ZONE_ID_SOCIAL'
      }
    },
    // Fallback ads when networks don't load
    fallback: {
      enabled: true,
      imageUrl: 'https://via.placeholder.com/320x50/0A0E1A/D4AF37?text=Advertisement',
      imageUrlInterstitial: 'https://via.placeholder.com/300x250/0A0E1A/D4AF37?text=Sponsored+Content'
    }
  },

  // ===== AD UNIT REGISTRY =====
  _loadedAds: {},
  _interstitialReady: false,
  _rewardedReady: false,

  // ===== INITIALIZE ALL AD NETWORKS =====
  init: function() {
    console.log('📢 AdNetwork: Initializing...');
    
    // Load AdSense
    if (this.config.adsense.enabled && !window.adsbygoogle) {
      this._loadAdSense();
    }
    
    // Load Adsterra
    if (this.config.adsterra.enabled) {
      this._loadAdsterra();
    }
    
    // Initialize fallback system
    this._initFallback();
    
    // Auto-refresh banners every 60s
    setInterval(this.refreshBanners.bind(this), 60000);
    
    console.log('📢 AdNetwork: Ready');
  },

  // ===== LOAD ADSENSE =====
  _loadAdSense: function() {
    try {
      var script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + this.config.adsense.publisherId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = function() {
        console.log('📢 AdSense loaded');
        AdNetwork._renderAdsenseSlots();
      };
      script.onerror = function() {
        console.warn('📢 AdSense failed to load');
      };
      document.head.appendChild(script);
    } catch(e) {
      console.warn('📢 AdSense init error:', e.message);
    }
  },

  _renderAdsenseSlots: function() {
    qsa('.ad-slot-adsense').forEach(function(el) {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) {
        console.warn('AdSense slot error:', e.message);
        el.innerHTML = AdNetwork._getFallbackBanner();
      }
    });
  },

  // ===== LOAD ADSTERRA =====
  _loadAdsterra: function() {
    try {
      var script = document.createElement('script');
      script.src = 'https://www.vccintegration.com/script.js?token=' + this.config.adsterra.token;
      script.async = true;
      script.onload = function() { console.log('📢 Adsterra loaded'); };
      script.onerror = function() { console.warn('📢 Adsterra failed'); };
      document.body.appendChild(script);
    } catch(e) {
      console.warn('📢 Adsterra init error:', e.message);
    }
  },

  // ===== FALLBACK SYSTEM =====
  _initFallback: function() {
    // Replace ad slots with fallback after a timeout
    setTimeout(function() {
      qsa('.ad-slot:not(.ad-rendered)').forEach(function(el) {
        if (!el.classList.contains('ad-rendered')) {
          var type = el.dataset.adType || 'banner';
          el.innerHTML = AdNetwork._getFallbackHTML(type);
          el.classList.add('ad-rendered');
        }
      });
    }, 3000);
  },

  _getFallbackBanner: function() {
    return '<div style="width:100%;height:50px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(255,255,255,0.15)"><span>📢 Advertisement</span></div>';
  },

  _getFallbackInterstitial: function() {
    return '<div style="padding:40px;text-align:center"><div style="font-size:48px;margin-bottom:12px">📢</div><div style="font-size:14px;color:var(--text-secondary)">Sponsored Content</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Loading advertisement...</div></div>';
  },

  _getFallbackHTML: function(type) {
    if (type === 'interstitial') return this._getFallbackInterstitial();
    return this._getFallbackBanner();
  },

  // ===== RENDER BANNER AD =====
  renderBanner: function(containerId, type) {
    type = type || 'banner';
    var container = $(containerId);
    if (!container) return;
    
    container.innerHTML = '<div id="adSlot_' + containerId + '" class="ad-slot ad-slot-' + type + '" data-ad-type="' + type + '"></div>';
    
    var slot = $('adSlot_' + containerId);
    
    // Try AdSense first
    if (this.config.adsense.enabled && window.adsbygoogle) {
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.dataset.adClient = this.config.adsense.publisherId;
      ins.dataset.adSlot = this.config.adsense.slots[type] || this.config.adsense.slots.banner;
      ins.dataset.adFormat = type === 'banner' ? 'auto' : 'rectangle';
      ins.dataset.fullWidthResponsive = 'true';
      slot.appendChild(ins);
      try { (adsbygoogle = window.adsbygoogle || []).push({}); slot.classList.add('ad-rendered'); } catch(e) { console.warn('AdSense render error:', e.message); }
    } 
    // Fallback to Adsterra
    else if (this.config.adsterra.enabled) {
      var script = document.createElement('script');
      script.src = 'https://www.vccintegration.com/display.js?zone=' + this.config.adsterra.zones[type] + '&container=' + containerId;
      slot.appendChild(script);
      slot.classList.add('ad-rendered');
    }
    // Final fallback
    else {
      slot.innerHTML = this._getFallbackHTML(type);
      slot.classList.add('ad-rendered');
    }
  },

  // ===== SHOW INTERSTITIAL =====
  showInterstitial: function(callback) {
    callback = callback || function(){};
    
    // Try AdSense Interstitial
    if (this.config.adsense.enabled && window.adsbygoogle) {
      try {
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.dataset.adClient = this.config.adsense.publisherId;
        ins.dataset.adSlot = this.config.adsense.slots.interstitial;
        ins.dataset.adFormat = 'interstitial';
        document.body.appendChild(ins);
        (adsbygoogle = window.adsbygoogle || []).push({});
        
        // Show interstitial overlay
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
        overlay.innerHTML = '<div style="text-align:center"><div style="font-size:48px;margin-bottom:12px">📢</div><div style="font-size:16px;font-weight:600;margin-bottom:4px">Sponsored</div><div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Please wait a moment...</div><button onclick="this.parentElement.parentElement.remove()" style="padding:8px 24px;border-radius:8px;background:var(--gold);color:#0A0E1A;border:none;font-size:14px;font-weight:600;cursor:pointer">Skip →</button></div>';
        document.body.appendChild(overlay);
        
        setTimeout(function() { overlay.remove(); callback(); }, 5000);
        return;
      } catch(e) {}
    }
    
    // Fallback interstitial
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease';
    overlay.innerHTML = 
      '<div style="background:rgba(16,24,40,0.96);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px 24px;text-align:center;max-width:300px;width:90%">' +
        '<div style="font-size:48px;margin-bottom:12px">📢</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:4px">Sponsored Content</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">Support our platform by viewing this ad</div>' +
        '<button onclick="this.closest(\'[data-ad-overlay]\').remove();' + callback.toString().replace(/"/g,"'") + '()" style="padding:12px 32px;border-radius:10px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#0A0E1A;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s">Continue →</button>' +
      '</div>';
    overlay.setAttribute('data-ad-overlay', '');
    document.body.appendChild(overlay);
    
    setTimeout(function() {
      var cb = overlay.querySelector('button');
      if (cb) cb.click();
    }, 8000);
  },

  // ===== REFRESH BANNERS =====
  refreshBanners: function() {
    qsa('.ad-slot-adsense ins.adsbygoogle').forEach(function(el) {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch(e) {}
    });
  },

  // ===== CREATE BANNER PLACEMENTS ON PAGE =====
  createBannerPlacements: function() {
    // Top banner
    var topBanner = document.createElement('div');
    topBanner.id = 'adTopBanner';
    topBanner.style.cssText = 'margin-bottom:12px;min-height:50px';
    
    // Insert after status bar
    var main = document.querySelector('.main-content');
    if (main) main.insertBefore(topBanner, main.firstChild);
    
    this.renderBanner('adTopBanner', 'banner');
    
    // Bottom banner (before nav)
    var bottomBanner = document.createElement('div');
    bottomBanner.id = 'adBottomBanner';
    bottomBanner.style.cssText = 'margin-top:16px;min-height:50px';
    if (main) main.appendChild(bottomBanner);
    
    this.renderBanner('adBottomBanner', 'banner');
  }
};

// ===== AUTO-INIT =====
setTimeout(function() {
  if (typeof AdNetwork !== 'undefined') {
    AdNetwork.init();
    // Wait for DOM
    if (document.readyState === 'complete') {
      AdNetwork.createBannerPlacements();
    } else {
      window.addEventListener('load', function() { AdNetwork.createBannerPlacements(); });
    }
  }
}, 1000);
