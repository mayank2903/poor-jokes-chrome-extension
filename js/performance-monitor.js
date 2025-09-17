// Performance Monitoring System
// Tracks API response times, cache performance, and user experience metrics

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      cachePerformance: {
        hits: 0,
        misses: 0,
        evictions: 0
      },
      userExperience: {
        jokeLoadTimes: [],
        totalJokesShown: 0,
        averageRating: 0,
        errorCount: 0
      },
      systemHealth: {
        lastApiCheck: null,
        apiHealthStatus: 'unknown',
        consecutiveFailures: 0
      }
    };
    
    this.startTime = Date.now();
    this.maxMetricsHistory = 100; // Keep last 100 entries
  }

  // Track API call performance
  trackApiCall(endpoint, startTime, endTime, success, responseSize = 0) {
    const duration = endTime - startTime;
    const apiCall = {
      endpoint,
      duration,
      success,
      responseSize,
      timestamp: new Date().toISOString()
    };
    
    this.metrics.apiCalls.push(apiCall);
    
    // Keep only recent metrics
    if (this.metrics.apiCalls.length > this.maxMetricsHistory) {
      this.metrics.apiCalls.shift();
    }
    
    // Update system health
    if (success) {
      this.metrics.systemHealth.consecutiveFailures = 0;
      this.metrics.systemHealth.apiHealthStatus = 'healthy';
    } else {
      this.metrics.systemHealth.consecutiveFailures++;
      if (this.metrics.systemHealth.consecutiveFailures >= 3) {
        this.metrics.systemHealth.apiHealthStatus = 'degraded';
      }
    }
    
    this.metrics.systemHealth.lastApiCheck = new Date().toISOString();
    
    console.log(`📊 API Call: ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  // Track cache performance
  trackCacheHit() {
    this.metrics.cachePerformance.hits++;
  }

  trackCacheMiss() {
    this.metrics.cachePerformance.misses++;
  }

  trackCacheEviction() {
    this.metrics.cachePerformance.evictions++;
  }

  // Track joke loading performance
  trackJokeLoad(startTime, endTime, source = 'unknown') {
    const duration = endTime - startTime;
    this.metrics.userExperience.jokeLoadTimes.push({
      duration,
      source,
      timestamp: new Date().toISOString()
    });
    
    // Keep only recent metrics
    if (this.metrics.userExperience.jokeLoadTimes.length > this.maxMetricsHistory) {
      this.metrics.userExperience.jokeLoadTimes.shift();
    }
    
    this.metrics.userExperience.totalJokesShown++;
    
    console.log(`🎭 Joke loaded in ${duration}ms from ${source}`);
  }

  // Track user ratings
  trackRating(jokeId, rating) {
    // Simple average calculation (in real app, you'd want more sophisticated tracking)
    const currentTotal = this.metrics.userExperience.averageRating * (this.metrics.userExperience.totalJokesShown - 1);
    this.metrics.userExperience.averageRating = (currentTotal + rating) / this.metrics.userExperience.totalJokesShown;
  }

  // Track errors
  trackError(error, context = 'unknown') {
    this.metrics.userExperience.errorCount++;
    console.error(`❌ Error in ${context}:`, error);
  }

  // Get performance summary
  getPerformanceSummary() {
    const apiCalls = this.metrics.apiCalls;
    const jokeLoadTimes = this.metrics.userExperience.jokeLoadTimes;
    
    const avgApiResponseTime = apiCalls.length > 0 
      ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length 
      : 0;
    
    const avgJokeLoadTime = jokeLoadTimes.length > 0
      ? jokeLoadTimes.reduce((sum, load) => sum + load.duration, 0) / jokeLoadTimes.length
      : 0;
    
    const cacheHitRate = this.metrics.cachePerformance.hits + this.metrics.cachePerformance.misses > 0
      ? this.metrics.cachePerformance.hits / (this.metrics.cachePerformance.hits + this.metrics.cachePerformance.misses)
      : 0;
    
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: Math.round(uptime / 1000), // seconds
      apiPerformance: {
        totalCalls: apiCalls.length,
        averageResponseTime: Math.round(avgApiResponseTime),
        successRate: apiCalls.length > 0 ? apiCalls.filter(call => call.success).length / apiCalls.length : 0,
        lastCall: apiCalls.length > 0 ? apiCalls[apiCalls.length - 1].timestamp : null
      },
      cachePerformance: {
        hitRate: Math.round(cacheHitRate * 100),
        hits: this.metrics.cachePerformance.hits,
        misses: this.metrics.cachePerformance.misses,
        evictions: this.metrics.cachePerformance.evictions
      },
      userExperience: {
        totalJokesShown: this.metrics.userExperience.totalJokesShown,
        averageLoadTime: Math.round(avgJokeLoadTime),
        averageRating: Math.round(this.metrics.userExperience.averageRating * 100) / 100,
        errorCount: this.metrics.userExperience.errorCount
      },
      systemHealth: this.metrics.systemHealth
    };
  }

  // Get detailed metrics for debugging
  getDetailedMetrics() {
    return {
      ...this.metrics,
      summary: this.getPerformanceSummary()
    };
  }

  // Reset all metrics
  reset() {
    this.metrics = {
      apiCalls: [],
      cachePerformance: {
        hits: 0,
        misses: 0,
        evictions: 0
      },
      userExperience: {
        jokeLoadTimes: [],
        totalJokesShown: 0,
        averageRating: 0,
        errorCount: 0
      },
      systemHealth: {
        lastApiCheck: null,
        apiHealthStatus: 'unknown',
        consecutiveFailures: 0
      }
    };
    this.startTime = Date.now();
  }

  // Log performance summary to console
  logSummary() {
    const summary = this.getPerformanceSummary();
    console.log('📊 Performance Summary:', summary);
    return summary;
  }
}

// Create global instance
window.PerformanceMonitor = new PerformanceMonitor();

// Add performance tracking to fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const startTime = Date.now();
  const url = args[0];
  
  return originalFetch.apply(this, args)
    .then(response => {
      const endTime = Date.now();
      const success = response.ok;
      
      // Try to get response size
      const contentLength = response.headers.get('content-length');
      const responseSize = contentLength ? parseInt(contentLength) : 0;
      
      window.PerformanceMonitor.trackApiCall(url, startTime, endTime, success, responseSize);
      
      return response;
    })
    .catch(error => {
      const endTime = Date.now();
      window.PerformanceMonitor.trackApiCall(url, startTime, endTime, false, 0);
      window.PerformanceMonitor.trackError(error, 'fetch');
      throw error;
    });
};
