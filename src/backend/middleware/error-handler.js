/**
 * @fileoverview Centralized error handling middleware
 */

const { APP_CONSTANTS, HTTP_STATUS } = require('../../../shared/constants');

/**
 * Error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(error, req, res, next) {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Determine error type and status
  let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR;

  if (error.name === 'ValidationError') {
    status = HTTP_STATUS.BAD_REQUEST;
    message = APP_CONSTANTS.ERROR_MESSAGES.VALIDATION_ERROR;
  } else if (error.name === 'UnauthorizedError') {
    status = HTTP_STATUS.UNAUTHORIZED;
    message = APP_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED;
  } else if (error.name === 'NotFoundError') {
    status = HTTP_STATUS.NOT_FOUND;
    message = APP_CONSTANTS.ERROR_MESSAGES.NOT_FOUND;
  } else if (error.status) {
    status = error.status;
    message = error.message;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
}

/**
 * 404 handler for undefined routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.name = 'NotFoundError';
  next(error);
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
