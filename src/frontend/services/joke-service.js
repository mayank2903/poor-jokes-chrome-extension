/**
 * @fileoverview Joke service for managing jokes, ratings, and submissions
 */

const { apiClient, APIError } = require('./api-client');
const { APP_CONSTANTS } = require('../../shared/constants');

/**
 * Joke service class
 */
class JokeService {
  constructor() {
    this.cache = new Map();
    this.ratedJokes = this.loadRatedJokes();
    this.userId = this.getOrCreateUserId();
  }

  /**
   * Get or create user ID
   * @returns {string} User ID
   */
  getOrCreateUserId() {
    let userId = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  }

  /**
   * Load rated jokes from storage
   * @returns {Set} Set of rated joke IDs
   */
  loadRatedJokes() {
    const stored = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.RATED_JOKES);
    return new Set(stored ? JSON.parse(stored) : []);
  }

  /**
   * Save rated jokes to storage
   */
  saveRatedJokes() {
    localStorage.setItem(
      APP_CONSTANTS.STORAGE_KEYS.RATED_JOKES,
      JSON.stringify([...this.ratedJokes])
    );
  }

  /**
   * Get jokes from API with caching
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of jokes
   */
  async getJokes(options = {}) {
    try {
      const cacheKey = JSON.stringify(options);
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await apiClient.getJokes(options);
      
      if (response.success && response.jokes) {
        this.cache.set(cacheKey, response.jokes);
        return response.jokes;
      }
      
      throw new APIError('Failed to fetch jokes', 0, response);
    } catch (error) {
      console.error('Error fetching jokes:', error);
      throw error;
    }
  }

  /**
   * Get a random joke
   * @returns {Promise<Object>} Random joke
   */
  async getRandomJoke() {
    try {
      const jokes = await this.getJokes();
      if (jokes.length === 0) {
        throw new APIError('No jokes available', 0, {});
      }
      
      const randomIndex = Math.floor(Math.random() * jokes.length);
      return jokes[randomIndex];
    } catch (error) {
      console.error('Error getting random joke:', error);
      throw error;
    }
  }

  /**
   * Rate a joke
   * @param {string} jokeId - Joke ID
   * @param {string} rating - Rating type ('up' or 'down')
   * @returns {Promise<Object>} Rating result
   */
  async rateJoke(jokeId, rating) {
    try {
      // Check if already rated
      if (this.ratedJokes.has(jokeId)) {
        throw new APIError('Joke already rated', 400, {});
      }

      // Validate rating
      if (!Object.values(APP_CONSTANTS.RATING_TYPES).includes(rating)) {
        throw new APIError('Invalid rating type', 400, {});
      }

      const response = await apiClient.rateJoke(jokeId, this.userId, rating);
      
      if (response.success) {
        // Mark as rated
        this.ratedJokes.add(jokeId);
        this.saveRatedJokes();
        
        // Clear cache to get updated ratings
        this.cache.clear();
        
        return response;
      }
      
      throw new APIError(response.error || 'Failed to rate joke', 0, response);
    } catch (error) {
      console.error('Error rating joke:', error);
      throw error;
    }
  }

  /**
   * Submit a new joke
   * @param {string} content - Joke content
   * @param {string} submittedBy - Submitter name
   * @returns {Promise<Object>} Submission result
   */
  async submitJoke(content, submittedBy = 'Anonymous') {
    try {
      // Validate content
      if (!content || content.trim().length < APP_CONSTANTS.DEFAULTS.MIN_JOKE_LENGTH) {
        throw new APIError('Joke content too short', 400, {});
      }
      
      if (content.length > APP_CONSTANTS.DEFAULTS.MAX_JOKE_LENGTH) {
        throw new APIError('Joke content too long', 400, {});
      }

      const response = await apiClient.submitJoke({
        content: content.trim(),
        submitted_by: submittedBy
      });
      
      if (response.success) {
        return response;
      }
      
      throw new APIError(response.error || 'Failed to submit joke', 0, response);
    } catch (error) {
      console.error('Error submitting joke:', error);
      throw error;
    }
  }

  /**
   * Check if joke has been rated
   * @param {string} jokeId - Joke ID
   * @returns {boolean} Whether joke has been rated
   */
  isJokeRated(jokeId) {
    return this.ratedJokes.has(jokeId);
  }

  /**
   * Get user ID
   * @returns {string} User ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ratedJokes: this.ratedJokes.size,
      userId: this.userId
    };
  }
}

// Create singleton instance
const jokeService = new JokeService();

module.exports = jokeService;
