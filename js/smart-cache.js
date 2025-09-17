// Smart Caching System for Large Joke Datasets
// Handles chunked loading, LRU eviction, and background prefetching

class SmartJokeCache {
  constructor() {
    this.cache = new Map(); // jokeId -> joke data
    this.accessOrder = []; // LRU tracking
    this.maxCacheSize = 200; // Maximum jokes to keep in memory
    this.chunkSize = 50; // Jokes per API request
    this.currentPage = 1;
    this.totalPages = 1;
    this.isLoading = false;
    this.loadedPages = new Set();
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiRequests: 0,
      totalJokesLoaded: 0
    };
  }

  // Get a random joke with smart selection
  async getRandomJoke() {
    const availableJokes = Array.from(this.cache.values());
    
    if (availableJokes.length === 0) {
      console.log('🔄 Smart cache empty, loading initial chunk...');
      await this.loadInitialChunk();
      const newJokes = Array.from(this.cache.values());
      if (newJokes.length === 0) {
        console.error('❌ Failed to load jokes into smart cache');
        return null;
      }
      return this.getRandomJoke();
    }

    // Use weighted selection for better variety
    const randomJoke = availableJokes[Math.floor(Math.random() * availableJokes.length)];
    this.updateAccessOrder(randomJoke.id);
    
    this.metrics.cacheHits++;
    return randomJoke;
  }

  // Load initial chunk of jokes
  async loadInitialChunk() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      console.log('🌐 Fetching jokes from API...');
      const data = await this.fetchJokesPage(1);
      
      if (data && data.jokes && data.jokes.length > 0) {
        this.addJokesToCache(data.jokes);
        this.currentPage = data.pagination.page;
        this.totalPages = data.pagination.totalPages;
        this.loadedPages.add(1);
        
        this.metrics.apiRequests++;
        this.metrics.totalJokesLoaded += data.jokes.length;
        
        console.log(`📦 Loaded initial chunk: ${data.jokes.length} jokes (Page 1/${data.pagination.totalPages})`);
      } else {
        console.error('❌ API returned no jokes or invalid data:', data);
        throw new Error('No jokes received from API');
      }
    } catch (error) {
      console.error('❌ Error loading initial chunk:', error);
      throw error; // Re-throw to let caller handle
    } finally {
      this.isLoading = false;
    }
  }

  // Prefetch next chunk in background
  async prefetchNextChunk() {
    if (this.isLoading || this.currentPage >= this.totalPages) return;
    
    const nextPage = this.currentPage + 1;
    if (this.loadedPages.has(nextPage)) return;
    
    this.isLoading = true;
    try {
      const data = await this.fetchJokesPage(nextPage);
      this.addJokesToCache(data.jokes);
      this.currentPage = nextPage;
      this.loadedPages.add(nextPage);
      
      this.metrics.apiRequests++;
      this.metrics.totalJokesLoaded += data.jokes.length;
      
      console.log(`🔄 Prefetched chunk: ${data.jokes.length} jokes (Page ${nextPage}/${data.pagination.totalPages})`);
    } catch (error) {
      console.error('Error prefetching chunk:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Fetch jokes from API with pagination
  async fetchJokesPage(page) {
    const url = `${window.APIConfig.getBaseURL()}/jokes?page=${page}&limit=${this.chunkSize}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  }

  // Add jokes to cache with LRU management
  addJokesToCache(jokes) {
    jokes.forEach(joke => {
      if (!this.cache.has(joke.id)) {
        // Check if we need to evict old jokes
        if (this.cache.size >= this.maxCacheSize) {
          this.evictLeastRecentlyUsed();
        }
        
        this.cache.set(joke.id, joke);
        this.accessOrder.push(joke.id);
      }
    });
  }

  // Update access order for LRU tracking
  updateAccessOrder(jokeId) {
    const index = this.accessOrder.indexOf(jokeId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(jokeId);
  }

  // Evict least recently used joke
  evictLeastRecentlyUsed() {
    if (this.accessOrder.length === 0) return;
    
    const lruJokeId = this.accessOrder.shift();
    this.cache.delete(lruJokeId);
    
    console.log(`🗑️ Evicted joke from cache: ${lruJokeId}`);
  }

  // Get cache statistics
  getStats() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      loadedPages: this.loadedPages.size,
      totalPages: this.totalPages,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    };
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.loadedPages.clear();
    this.currentPage = 1;
    this.totalPages = 1;
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      apiRequests: 0,
      totalJokesLoaded: 0
    };
  }

  // Check if we should prefetch more jokes
  shouldPrefetch() {
    const availableJokes = this.cache.size;
    const threshold = Math.min(this.maxCacheSize * 0.3, 50); // Prefetch when 30% of cache is used
    
    return availableJokes < threshold && 
           this.currentPage < this.totalPages && 
           !this.isLoading;
  }

  // Smart prefetching based on usage patterns
  async smartPrefetch() {
    if (this.shouldPrefetch()) {
      await this.prefetchNextChunk();
    }
  }
}

// Create global instance
window.SmartJokeCache = new SmartJokeCache();
