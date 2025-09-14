/**
 * @fileoverview Shared type definitions and interfaces for the Poor Jokes extension
 */

/**
 * @typedef {Object} Joke
 * @property {string} id - Unique identifier
 * @property {string} content - Joke text
 * @property {string} created_at - ISO timestamp
 * @property {number} up_votes - Number of upvotes
 * @property {number} down_votes - Number of downvotes
 * @property {number} total_votes - Total votes
 * @property {number} rating_percentage - Calculated rating percentage
 */

/**
 * @typedef {Object} JokeSubmission
 * @property {string} id - Unique identifier
 * @property {string} content - Submitted joke text
 * @property {string} submitted_by - Submitter identifier
 * @property {string} status - 'pending' | 'approved' | 'rejected'
 * @property {string} created_at - ISO timestamp
 * @property {string} reviewed_at - ISO timestamp when reviewed
 * @property {string} reviewed_by - Reviewer identifier
 * @property {string} rejection_reason - Reason for rejection (if applicable)
 */

/**
 * @typedef {Object} Rating
 * @property {string} joke_id - ID of the joke being rated
 * @property {string} user_id - ID of the user rating
 * @property {'up'|'down'} rating - Rating type
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} data - Response data
 * @property {string} [error] - Error message if unsuccessful
 * @property {string} [message] - Additional message
 */

/**
 * @typedef {Object} EnvironmentConfig
 * @property {string} baseUrl - API base URL
 * @property {string} version - Version number
 * @property {boolean} cacheBust - Whether to add cache busting
 */

/**
 * @typedef {Object} DeploymentInfo
 * @property {string} version - Deployment version
 * @property {string} timestamp - Deployment timestamp
 * @property {string} deploymentId - Unique deployment identifier
 */

/**
 * @typedef {Object} NotificationConfig
 * @property {string} [gmailClientId] - Gmail API client ID
 * @property {string} [gmailClientSecret] - Gmail API client secret
 * @property {string} [gmailRefreshToken] - Gmail API refresh token
 * @property {string} [gmailUserEmail] - Gmail user email
 */

/**
 * @typedef {Object} SupabaseConfig
 * @property {string} url - Supabase project URL
 * @property {string} anonKey - Supabase anonymous key
 * @property {string} serviceRoleKey - Supabase service role key
 */

/**
 * @typedef {Object} AdminConfig
 * @property {string} password - Admin password
 * @property {string} email - Admin email
 */

// Export types for JSDoc
module.exports = {};
