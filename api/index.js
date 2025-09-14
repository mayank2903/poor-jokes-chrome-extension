/**
 * @fileoverview Main API endpoint - provides API information and health status
 */

const cors = require('cors');

// CORS configuration
const corsHandler = cors({
  origin: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-version']
});

/**
 * Main API handler
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => res.status(200).end());
  }

  // Apply CORS to all requests
  corsHandler(req, res, async () => {
    try {
      if (req.method === 'GET') {
        return await handleGetAPIInfo(req, res);
      } else {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }
    } catch (error) {
      console.error('API Index error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

/**
 * Handle GET requests - return API information
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleGetAPIInfo(req, res) {
  const apiInfo = {
    success: true,
    message: 'Poor Jokes API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      jokes: '/api/jokes',
      rate: '/api/rate',
      submissions: '/api/submissions',
      test: '/api/test',
      testEnv: '/api/test-env'
    },
    features: {
      jokeSubmission: true,
      ratingSystem: true,
      adminDashboard: true,
      emailNotifications: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET)
    },
    documentation: {
      github: 'https://github.com/mayank2903/poor-jokes-chrome-extension',
      readme: 'https://github.com/mayank2903/poor-jokes-chrome-extension#readme'
    }
  };

  return res.status(200).json(apiInfo);
}

module.exports = handler;
