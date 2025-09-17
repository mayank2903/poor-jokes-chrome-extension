// Centralized API Configuration
// Update this file when deploying to get the latest URL everywhere

const API_CONFIG = {
  // Stable production API URL - this never changes!
  PRODUCTION_URL: 'https://poor-jokes-newtab.vercel.app/api',
  
  // Single stable production URL - no fallbacks needed
  FALLBACK_URLS: [
    'https://poor-jokes-newtab.vercel.app/api' // Only stable production URL
  ],
  
  // Admin dashboard URL
  ADMIN_URL: 'https://poor-jokes-newtab.vercel.app/admin-local.html',
  
  // Base URL (without /api)
  BASE_URL: 'https://poor-jokes-newtab.vercel.app',
  
  // Environment detection
  getCurrentUrl: function() {
    // In browser, check if we're in development
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        return 'http://localhost:3000/api'; // Local development
      }
    }
    
    // Default to production
    return this.PRODUCTION_URL;
  },
  
  // Get admin URL
  getAdminUrl: function() {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        return 'http://localhost:3000/admin-local.html'; // Local development
      }
    }
    
    return this.ADMIN_URL;
  }
};

// Export for Node.js (API files)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

// Export for browser (client-side files)
if (typeof window !== 'undefined') {
  window.APIConfig = API_CONFIG;
}
