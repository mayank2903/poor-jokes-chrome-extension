/**
 * @fileoverview Shared constants and configuration values
 */

/**
 * Application constants
 */
const APP_CONSTANTS = {
  NAME: 'Poor Jokes New Tab',
  VERSION: '1.0.0',
  SHORT_NAME: 'Joor Pokes',
  AUTHOR: 'Poor Jokes Team',
  MIN_CHROME_VERSION: '88',
  
  // API endpoints
  ENDPOINTS: {
    JOKES: '/api/jokes',
    RATE: '/api/rate',
    SUBMISSIONS: '/api/submissions',
    TEST: '/api/test',
    TEST_ENV: '/api/test-env'
  },
  
  // Storage keys
  STORAGE_KEYS: {
    USER_ID: 'poor_jokes_user_id',
    RATED_JOKES: 'poor_jokes_rated',
    SETTINGS: 'poor_jokes_settings'
  },
  
  // Rating types
  RATING_TYPES: {
    UP: 'up',
    DOWN: 'down'
  },
  
  // Submission statuses
  SUBMISSION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  
  // UI states
  UI_STATES: {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    IDLE: 'idle'
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    API_ERROR: 'API error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNAUTHORIZED: 'Unauthorized access.',
    NOT_FOUND: 'Resource not found.',
    SERVER_ERROR: 'Server error. Please try again later.'
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    JOKE_SUBMITTED: 'Joke submitted successfully!',
    JOKE_RATED: 'Thank you for rating!',
    JOKE_APPROVED: 'Joke approved successfully!',
    JOKE_REJECTED: 'Joke rejected.'
  },
  
  // Default values
  DEFAULTS: {
    JOKES_PER_PAGE: 20,
    MAX_JOKE_LENGTH: 500,
    MIN_JOKE_LENGTH: 10,
    RATING_COOLDOWN: 1000, // 1 second
    API_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3
  }
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENT_CONFIGS = {
  development: {
    baseUrl: 'http://localhost:3001/api',
    version: '1.0.0-dev',
    cacheBust: true,
    debug: true
  },
  production: {
    baseUrl: 'https://poor-jokes-newtab-4r0gcrtx0-mayanks-projects-72f678fa.vercel.app/api',
    version: '1.0.0',
    cacheBust: false,
    debug: false
  }
};

/**
 * CSS classes for consistent styling
 */
const CSS_CLASSES = {
  // Layout
  CONTAINER: 'container',
  CARD: 'card',
  JOKE_CARD: 'joke-card',
  
  // States
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  HIDDEN: 'hidden',
  
  // Buttons
  BUTTON: 'btn',
  BUTTON_PRIMARY: 'btn-primary',
  BUTTON_SECONDARY: 'btn-secondary',
  BUTTON_SUCCESS: 'btn-success',
  BUTTON_DANGER: 'btn-danger',
  BUTTON_DISABLED: 'btn-disabled',
  
  // Rating
  RATING_CONTAINER: 'rating-container',
  RATING_BUTTON: 'rating-btn',
  RATING_UP: 'rating-up',
  RATING_DOWN: 'rating-down',
  
  // Forms
  FORM: 'form',
  FORM_GROUP: 'form-group',
  FORM_INPUT: 'form-input',
  FORM_TEXTAREA: 'form-textarea',
  FORM_BUTTON: 'form-button',
  
  // Admin
  ADMIN_CONTAINER: 'admin-container',
  SUBMISSION_ITEM: 'submission-item',
  SUBMISSION_ACTIONS: 'submission-actions'
};

/**
 * API response status codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500
};

module.exports = {
  APP_CONSTANTS,
  ENVIRONMENT_CONFIGS,
  CSS_CLASSES,
  HTTP_STATUS
};
