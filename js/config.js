// API Configuration with Centralized URL Management
// Uses centralized URL configuration to prevent drift

class APIConfig {
  constructor() {
    // Import centralized URLs
    this.urls = window.URLConfig ? window.URLConfig.urls : {
      API: 'https://poor-jokes-newtab.vercel.app/api',
      BASE: 'https://poor-jokes-newtab.vercel.app'
    };
    
    this.environments = {
      development: {
        baseUrl: this.urls.API,
        version: '1.0.0-dev',
        cacheBust: true
      },
      production: {
        baseUrl: this.urls.API,
        version: '1.0.0',
        cacheBust: false
      }
    };
    
    // Fallback URLs for API failover - only use stable URL
    this.FALLBACK_URLS = [
      this.urls.API
    ];
    
    this.currentEnv = this.detectEnvironment();
    this.config = this.environments[this.currentEnv];
  }

  detectEnvironment() {
    // Detect environment based on hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
    }
    
    // Default to production
    return 'production';
  }

  getBaseURL() {
    return this.config.baseUrl;
  }

  getVersion() {
    return this.config.version;
  }

  // Add cache-busting parameter if needed
  getCacheBustedURL(endpoint) {
    const baseUrl = this.getBaseURL();
    const url = `${baseUrl}${endpoint}`;
    
    if (this.config.cacheBust) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${url}${separator}_cb=${Date.now()}`;
    }
    
    return url;
  }

  // Get API info for debugging
  getInfo() {
    return {
      environment: this.currentEnv,
      baseUrl: this.getBaseURL(),
      version: this.getVersion(),
      cacheBust: this.config.cacheBust
    };
  }
}

// Create global instance
window.APIConfig = new APIConfig();

// Log configuration for debugging
console.log('🔧 API Configuration:', window.APIConfig.getInfo());

// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:07:52.928Z',
  deploymentId: 'deploy_1757876872928_64ygo6y9k'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:09:42.903Z',
  deploymentId: 'deploy_1757876982903_4gwo1dtay'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:11:15.885Z',
  deploymentId: 'deploy_1757877075886_qi6ayhj9n'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:21:52.046Z',
  deploymentId: 'deploy_1757877712046_hev089i73'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:23:22.023Z',
  deploymentId: 'deploy_1757877802023_j1izc3jnr'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:43:43.464Z',
  deploymentId: 'deploy_1757879023465_fb5e00uwu'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:46:48.528Z',
  deploymentId: 'deploy_1757879208528_fk9gglmid'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:48:20.213Z',
  deploymentId: 'deploy_1757879300214_ywr2gglqr'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:51:22.478Z',
  deploymentId: 'deploy_1757879482479_ui5ya8q37'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T19:58:27.416Z',
  deploymentId: 'deploy_1757879907417_f8vl1brc0'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T20:04:29.668Z',
  deploymentId: 'deploy_1757880269668_yvbjp6enz'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T20:05:30.928Z',
  deploymentId: 'deploy_1757880330929_xkylhi6ds'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T20:07:50.366Z',
  deploymentId: 'deploy_1757880470366_rcxhq75r6'
};


// Deployment Info
window.DEPLOYMENT_INFO = {
  version: '1.0.0',
  timestamp: '2025-09-14T20:09:38.737Z',
  deploymentId: 'deploy_1757880578737_cxg96aumn'
};
