// API Manager with Health Checks and Fallbacks
// This ensures the system always uses a working API version

class APIManager {
  constructor() {
    this.config = window.APIConfig;
    this.healthCheckInterval = null;
    this.fallbackUrls = [
      'https://poor-jokes-newtab.vercel.app/api' // Only use stable production URL
    ];
    this.currentUrlIndex = 0;
    this.isHealthy = true;
    this.lastHealthCheck = null;
  }

  // Get current API URL
  getCurrentURL() {
    if (this.config.currentEnv === 'development') {
      return this.config.getBaseURL();
    }
    
    // Always use the stable production URL
    return 'https://poor-jokes-newtab.vercel.app/api';
  }

  // Health check for API endpoint
  async checkHealth(url = null) {
    const testUrl = url || this.getCurrentURL();
    const healthEndpoint = `${testUrl}/jokes`;
    
    try {
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await response.json();
      const isHealthy = response.ok && data.success;
      
      console.log(`🏥 Health check for ${testUrl}:`, isHealthy ? '✅ Healthy' : '❌ Unhealthy');
      
      return {
        url: testUrl,
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        response: data
      };
    } catch (error) {
      console.log(`🏥 Health check for ${testUrl}: ❌ Failed - ${error.message}`);
      return {
        url: testUrl,
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Find the best working API URL
  async findBestAPI() {
    console.log('🔍 Finding best API endpoint...');
    
    const healthChecks = await Promise.allSettled(
      this.fallbackUrls.map(url => this.checkHealth(url))
    );
    
    const results = healthChecks
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(result => result.healthy);
    
    if (results.length > 0) {
      const bestResult = results[0];
      this.currentUrlIndex = this.fallbackUrls.indexOf(bestResult.url);
      this.isHealthy = true;
      this.lastHealthCheck = bestResult.timestamp;
      
      console.log(`✅ Best API found: ${bestResult.url}`);
      return bestResult.url;
    } else {
      console.error('❌ No healthy API endpoints found!');
      this.isHealthy = false;
      return this.config.getBaseURL(); // Fallback to config default
    }
  }

  // Start periodic health checks
  startHealthMonitoring(intervalMs = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkHealth();
      if (!health.healthy) {
        console.warn('⚠️ Current API is unhealthy, finding alternative...');
        await this.findBestAPI();
      }
    }, intervalMs);
    
    console.log(`🏥 Health monitoring started (every ${intervalMs}ms)`);
  }

  // Stop health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 Health monitoring stopped');
    }
  }

  // Make API request to stable production URL
  async request(endpoint, options = {}) {
    const url = this.getCurrentURL();
    const fullUrl = `${url}${endpoint}`;
    
    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': this.config.getVersion(),
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${options.method || 'GET'} ${fullUrl}`);
      return data;
      
    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${fullUrl} - ${error.message}`);
      throw error;
    }
  }

  // Get current status
  getStatus() {
    return {
      currentUrl: this.getCurrentURL(),
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      environment: this.config.currentEnv,
      version: this.config.getVersion(),
      availableUrls: this.fallbackUrls
    };
  }
}

// Create global instance
window.APIManager = new APIManager();

// Auto-initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing API Manager...');
  
  // Find best API on page load
  await window.APIManager.findBestAPI();
  
  // Start health monitoring in production
  if (window.APIConfig.currentEnv === 'production') {
    window.APIManager.startHealthMonitoring();
  }
  
  console.log('📊 API Status:', window.APIManager.getStatus());
});
