/**
 * @fileoverview Centralized configuration management
 */

const { APP_CONSTANTS, ENVIRONMENT_CONFIGS } = require('../constants');

/**
 * Configuration manager class
 */
class ConfigManager {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.buildConfig();
    this.initialized = false;
  }

  /**
   * Detect current environment
   * @returns {string} Environment name
   */
  detectEnvironment() {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
    }
    
    // Check for Vercel environment
    if (process.env.VERCEL_ENV) {
      return process.env.VERCEL_ENV === 'production' ? 'production' : 'development';
    }
    
    return 'production';
  }

  /**
   * Build configuration object
   * @returns {Object} Complete configuration
   */
  buildConfig() {
    const envConfig = ENVIRONMENT_CONFIGS[this.environment] || ENVIRONMENT_CONFIGS.production;
    
    return {
      // App info
      app: {
        name: APP_CONSTANTS.NAME,
        version: envConfig.version,
        shortName: APP_CONSTANTS.SHORT_NAME,
        author: APP_CONSTANTS.AUTHOR,
        minChromeVersion: APP_CONSTANTS.MIN_CHROME_VERSION
      },
      
      // API configuration
      api: {
        baseUrl: envConfig.baseUrl,
        timeout: APP_CONSTANTS.DEFAULTS.API_TIMEOUT,
        retryAttempts: APP_CONSTANTS.DEFAULTS.RETRY_ATTEMPTS,
        endpoints: APP_CONSTANTS.ENDPOINTS
      },
      
      // Environment settings
      environment: {
        name: this.environment,
        debug: envConfig.debug,
        cacheBust: envConfig.cacheBust
      },
      
      // Feature flags
      features: {
        gmailNotifications: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
        adminDashboard: true,
        jokeSubmission: true,
        ratingSystem: true
      },
      
      // UI settings
      ui: {
        jokesPerPage: APP_CONSTANTS.DEFAULTS.JOKES_PER_PAGE,
        ratingCooldown: APP_CONSTANTS.DEFAULTS.RATING_COOLDOWN,
        maxJokeLength: APP_CONSTANTS.DEFAULTS.MAX_JOKE_LENGTH,
        minJokeLength: APP_CONSTANTS.DEFAULTS.MIN_JOKE_LENGTH
      },
      
      // Storage settings
      storage: {
        keys: APP_CONSTANTS.STORAGE_KEYS
      }
    };
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'api.baseUrl')
   * @returns {*} Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Get API URL for endpoint
   * @param {string} endpoint - Endpoint path
   * @returns {string} Full API URL
   */
  getApiUrl(endpoint) {
    const baseUrl = this.get('api.baseUrl');
    const url = `${baseUrl}${endpoint}`;
    
    if (this.get('environment.cacheBust')) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${url}${separator}_cb=${Date.now()}`;
    }
    
    return url;
  }

  /**
   * Get deployment info
   * @returns {Object} Deployment information
   */
  getDeploymentInfo() {
    return {
      version: this.get('app.version'),
      timestamp: new Date().toISOString(),
      deploymentId: `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      environment: this.environment
    };
  }

  /**
   * Initialize configuration
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    // Set up global deployment info
    if (typeof window !== 'undefined') {
      window.DEPLOYMENT_INFO = this.getDeploymentInfo();
      window.CONFIG = this.config;
    }
    
    this.initialized = true;
    
    if (this.get('environment.debug')) {
      console.log('🔧 Configuration initialized:', this.config);
    }
  }

  /**
   * Get configuration info for debugging
   * @returns {Object} Configuration info
   */
  getInfo() {
    return {
      environment: this.environment,
      baseUrl: this.get('api.baseUrl'),
      version: this.get('app.version'),
      features: this.get('features'),
      debug: this.get('environment.debug')
    };
  }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
