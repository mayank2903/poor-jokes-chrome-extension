/**
 * @fileoverview Modern jokes API endpoint with proper error handling and validation
 */

const cors = require('cors');
const databaseService = require('../services/database');
const { validateJokeSubmission } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/error-handler');
const { APP_CONSTANTS } = require('../../../shared/constants');

// Initialize database
databaseService.initialize();

// CORS configuration
const corsHandler = cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
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
      switch (req.method) {
        case 'GET':
          return await handleGetJokes(req, res);
        case 'POST':
          return await handleSubmitJoke(req, res);
        default:
          return res.status(405).json({
            success: false,
            error: 'Method not allowed'
          });
      }
    } catch (error) {
      console.error('Jokes API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

/**
 * Handle GET requests - fetch jokes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleGetJokes(req, res) {
  try {
    const { limit = 20, offset = 0, order_by = 'created_at' } = req.query;
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy: order_by,
      ascending: false
    };

    const jokes = await databaseService.getJokes(options);
    
    // Calculate additional stats
    const stats = await databaseService.getStats();
    
    return res.status(200).json({
      success: true,
      jokes: jokes,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: stats.totalJokes
      },
      stats: {
        totalJokes: stats.totalJokes,
        totalSubmissions: stats.totalSubmissions,
        totalRatings: stats.totalRatings
      }
    });
  } catch (error) {
    console.error('Error fetching jokes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jokes'
    });
  }
}

/**
 * Handle POST requests - submit new joke
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleSubmitJoke(req, res) {
  // Validate submission data
  validateJokeSubmission(req, res, async () => {
    try {
      const { content, submitted_by } = req.body;
      
      // Create submission
      const submission = await databaseService.createSubmission({
        content,
        submitted_by,
        status: APP_CONSTANTS.SUBMISSION_STATUS.PENDING,
        created_at: new Date().toISOString()
      });

      // Send notification (if configured)
      await sendSubmissionNotification(submission);

      return res.status(201).json({
        success: true,
        message: APP_CONSTANTS.SUCCESS_MESSAGES.JOKE_SUBMITTED,
        submission: {
          id: submission.id,
          status: submission.status,
          created_at: submission.created_at
        }
      });
    } catch (error) {
      console.error('Error submitting joke:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit joke'
      });
    }
  });
}

/**
 * Send submission notification
 * @param {Object} submission - Submission object
 */
async function sendSubmissionNotification(submission) {
  try {
    // Try email notification
    if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
      await sendEmailNotification(submission);
    }
  } catch (error) {
    console.error('Notification error:', error);
    // Don't fail the request if notifications fail
  }
}

/**
 * Send email notification
 * @param {Object} submission - Submission object
 */
async function sendEmailNotification(submission) {
  // This would integrate with the email service
  // For now, just log the submission
  console.log('Email notification would be sent for submission:', submission.id);
}

module.exports = handler;
