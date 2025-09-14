/**
 * @fileoverview Modern API client with error handling, retries, and type safety
 */

const configManager = require('../../shared/config');
const { APP_CONSTANTS, HTTP_STATUS } = require('../../shared/constants');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

/**
 * API client class with modern features
 */
class APIClient {
  constructor() {
    this.config = configManager;
    this.baseURL = this.config.get('api.baseUrl');
    this.timeout = this.config.get('api.timeout');
    this.retryAttempts = this.config.get('api.retryAttempts');
  }

  /**
   * Make HTTP request with retries and error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}, attempt = 1) {
    const url = this.config.getApiUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      const data = await response.json();
      
      if (!data.success && data.error) {
        throw new APIError(data.error, response.status, data);
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        if (attempt < this.retryAttempts) {
          console.warn(`API request failed (attempt ${attempt}), retrying...`);
          await this.delay(1000 * attempt); // Exponential backoff
          return this.request(endpoint, options, attempt + 1);
        }
      }

      // Handle specific error types
      if (error instanceof APIError) {
        throw error;
      }

      // Network or other errors
      throw new APIError(
        APP_CONSTANTS.ERROR_MESSAGES.NETWORK_ERROR,
        0,
        { error: error.message }
      );
    }
  }

  /**
   * Delay utility for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get jokes from API
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Jokes response
   */
  async getJokes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${APP_CONSTANTS.ENDPOINTS.JOKES}?${queryString}` : APP_CONSTANTS.ENDPOINTS.JOKES;
    
    return this.request(endpoint);
  }

  /**
   * Submit a new joke
   * @param {Object} jokeData - Joke submission data
   * @returns {Promise<Object>} Submission response
   */
  async submitJoke(jokeData) {
    return this.request(APP_CONSTANTS.ENDPOINTS.JOKES, {
      method: 'POST',
      body: JSON.stringify(jokeData)
    });
  }

  /**
   * Rate a joke
   * @param {string} jokeId - Joke ID
   * @param {string} userId - User ID
   * @param {string} rating - Rating type ('up' or 'down')
   * @returns {Promise<Object>} Rating response
   */
  async rateJoke(jokeId, userId, rating) {
    return this.request(APP_CONSTANTS.ENDPOINTS.RATE, {
      method: 'POST',
      body: JSON.stringify({
        joke_id: jokeId,
        user_id: userId,
        rating: rating
      })
    });
  }

  /**
   * Get submissions (admin only)
   * @param {string} status - Submission status filter
   * @param {string} adminPassword - Admin password
   * @returns {Promise<Object>} Submissions response
   */
  async getSubmissions(status = 'pending', adminPassword) {
    return this.request(`${APP_CONSTANTS.ENDPOINTS.SUBMISSIONS}?status=${status}`, {
      headers: {
        'x-admin-password': adminPassword
      }
    });
  }

  /**
   * Review submission (admin only)
   * @param {string} submissionId - Submission ID
   * @param {string} action - Action ('approve' or 'reject')
   * @param {string} adminPassword - Admin password
   * @param {Object} reviewData - Additional review data
   * @returns {Promise<Object>} Review response
   */
  async reviewSubmission(submissionId, action, adminPassword, reviewData = {}) {
    return this.request(APP_CONSTANTS.ENDPOINTS.SUBMISSIONS, {
      method: 'POST',
      headers: {
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({
        submission_id: submissionId,
        action: action,
        ...reviewData
      })
    });
  }

  /**
   * Test API health
   * @returns {Promise<Object>} Health check response
   */
  async healthCheck() {
    return this.request(APP_CONSTANTS.ENDPOINTS.TEST);
  }

  /**
   * Test environment variables
   * @returns {Promise<Object>} Environment test response
   */
  async testEnvironment() {
    return this.request(APP_CONSTANTS.ENDPOINTS.TEST_ENV);
  }
}

// Create singleton instance
const apiClient = new APIClient();

module.exports = { APIClient, APIError, apiClient };
