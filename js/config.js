// API Configuration with Environment Detection
// This ensures the correct API version is always used

class APIConfig {
  constructor() {
    this.environments = {
      development: {
        baseUrl: 'http://localhost:3001/api',
        version: '1.0.0-dev',
        cacheBust: true
      },
      production: {
        baseUrl: 'https://poor-jokes-newtab-7yprfgejg-mayanks-projects-72f678fa.vercel.app/api',
        version: '1.0.0',
        cacheBust: false
      }
    };
    
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
