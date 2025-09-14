/**
 * @fileoverview Request validation middleware
 */

const { APP_CONSTANTS } = require('../../../shared/constants');

/**
 * Validate joke submission data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validateJokeSubmission(req, res, next) {
  const { content, submitted_by } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Joke content is required'
    });
  }

  const trimmedContent = content.trim();
  
  if (trimmedContent.length < APP_CONSTANTS.DEFAULTS.MIN_JOKE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Joke content must be at least ${APP_CONSTANTS.DEFAULTS.MIN_JOKE_LENGTH} characters`
    });
  }

  if (trimmedContent.length > APP_CONSTANTS.DEFAULTS.MAX_JOKE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Joke content must be no more than ${APP_CONSTANTS.DEFAULTS.MAX_JOKE_LENGTH} characters`
    });
  }

  // Sanitize content
  req.body.content = trimmedContent;
  req.body.submitted_by = submitted_by?.trim() || 'Anonymous';

  next();
}

/**
 * Validate rating data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validateRating(req, res, next) {
  const { joke_id, user_id, rating } = req.body;

  if (!joke_id || typeof joke_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Joke ID is required'
    });
  }

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  if (!rating || !Object.values(APP_CONSTANTS.RATING_TYPES).includes(rating)) {
    return res.status(400).json({
      success: false,
      error: 'Valid rating is required (up or down)'
    });
  }

  next();
}

/**
 * Validate admin password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validateAdminPassword(req, res, next) {
  const adminPassword = req.headers['x-admin-password'];
  const expectedPassword = process.env.ADMIN_PASSWORD || 'PoorJokes2024!Admin';

  if (!adminPassword || adminPassword !== expectedPassword) {
    return res.status(401).json({
      success: false,
      error: APP_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED
    });
  }

  next();
}

/**
 * Validate submission review data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function validateSubmissionReview(req, res, next) {
  const { submission_id, action } = req.body;

  if (!submission_id || typeof submission_id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Submission ID is required'
    });
  }

  if (!action || !Object.values(APP_CONSTANTS.SUBMISSION_STATUS).includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Valid action is required (approve or reject)'
    });
  }

  next();
}

module.exports = {
  validateJokeSubmission,
  validateRating,
  validateAdminPassword,
  validateSubmissionReview
};
