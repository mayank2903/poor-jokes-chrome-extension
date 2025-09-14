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
        baseUrl: 'https://poor-jokes-newtab-h84vfdbd2-mayanks-projects-72f678fa.vercel.app/api',
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
  timestamp: '2025-09-14T16:31:54.501Z',
  deploymentId: 'deploy_1757867514502_ie3eccv6u'
};
