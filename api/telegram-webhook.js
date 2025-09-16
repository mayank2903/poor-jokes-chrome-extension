/**
 * @fileoverview Telegram webhook handler for bot interactions
 */

const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { answerCallbackQuery, editMessage } = require('../lib/telegram-notifications');
const { formatJokeContent, formatSubmitterName, validateJokeQuality } = require('../lib/joke-formatter');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS configuration
const corsHandler = cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

/**
 * Main webhook handler
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
      if (req.method === 'POST') {
        return await handleTelegramUpdate(req, res);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Telegram webhook error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

/**
 * Handle Telegram update
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleTelegramUpdate(req, res) {
  const update = req.body;

  // Handle callback query (button clicks)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }

  // Handle regular messages
  if (update.message) {
    await handleMessage(update.message);
  }

  return res.status(200).json({ ok: true });
}

/**
 * Handle callback query (button clicks)
 * @param {Object} callbackQuery - Callback query object
 */
async function handleCallbackQuery(callbackQuery) {
  const { id, data, message, from } = callbackQuery;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  try {
    // Parse callback data
    const [action, submissionId] = data.split('_');
    
    if (!submissionId) {
      await answerCallbackQuery(id, 'Invalid submission ID', true);
      return;
    }

    // Get submission from database
    const { data: submission, error: fetchError } = await supabase
      .from('joke_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      await answerCallbackQuery(id, 'Submission not found', true);
      return;
    }

    if (submission.status !== 'pending') {
      await answerCallbackQuery(id, 'Submission already reviewed', true);
      return;
    }

    // Handle approve action
    if (action === 'approve') {
      await handleApproveSubmission(submissionId, submission, id, chatId, messageId);
    }
    
    // Handle reject action
    else if (action === 'reject') {
      await handleRejectSubmission(submissionId, submission, id, chatId, messageId);
    }

  } catch (error) {
    console.error('Error handling callback query:', error);
    await answerCallbackQuery(id, 'An error occurred', true);
  }
}

/**
 * Handle approve submission
 * @param {string} submissionId - Submission ID
 * @param {Object} submission - Submission object
 * @param {string} callbackId - Callback query ID
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 */
async function handleApproveSubmission(submissionId, submission, callbackId, chatId, messageId) {
  try {
    // Format the joke content before adding to main table
    const contentResult = formatJokeContent(submission.content);
    
    if (!contentResult.isValid) {
      await answerCallbackQuery(callbackId, 'Cannot approve joke with invalid content', true);
      return;
    }

    // Validate joke quality
    const qualityCheck = validateJokeQuality(contentResult.formatted);
    
    // Add joke to main jokes table with formatted content
    const { data: newJoke, error: insertError } = await supabase
      .from('jokes')
      .insert([{
        content: contentResult.formatted
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('joke_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'telegram_bot'
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    // Update message with success
    const updatedText = `✅ *Joke Approved*

📝 *Approved Joke:*
"${submission.content}"

📊 *Details:*
• ID: \`${submissionId}\`
• Submitted by: ${submission.submitted_by || 'Anonymous'}
• Approved at: ${new Date().toLocaleString()}
• Status: ✅ Approved`;

    await editMessage(chatId, messageId, updatedText);
    await answerCallbackQuery(callbackId, 'Joke approved successfully!');

    console.log(`Joke ${submissionId} approved via Telegram`);

  } catch (error) {
    console.error('Error approving submission:', error);
    await answerCallbackQuery(callbackId, 'Failed to approve joke', true);
  }
}

/**
 * Handle reject submission
 * @param {string} submissionId - Submission ID
 * @param {Object} submission - Submission object
 * @param {string} callbackId - Callback query ID
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 */
async function handleRejectSubmission(submissionId, submission, callbackId, chatId, messageId) {
  try {
    // Update submission status
    const { error: updateError } = await supabase
      .from('joke_submissions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'telegram_bot',
        rejection_reason: 'Rejected via Telegram'
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    // Update message with rejection
    const updatedText = `❌ *Joke Rejected*

📝 *Rejected Joke:*
"${submission.content}"

📊 *Details:*
• ID: \`${submissionId}\`
• Submitted by: ${submission.submitted_by || 'Anonymous'}
• Rejected at: ${new Date().toLocaleString()}
• Reason: Rejected via Telegram
• Status: ❌ Rejected`;

    await editMessage(chatId, messageId, updatedText);
    await answerCallbackQuery(callbackId, 'Joke rejected');

    console.log(`Joke ${submissionId} rejected via Telegram`);

  } catch (error) {
    console.error('Error rejecting submission:', error);
    await answerCallbackQuery(callbackId, 'Failed to reject joke', true);
  }
}

/**
 * Handle regular messages
 * @param {Object} message - Message object
 */
async function handleMessage(message) {
  const { text, chat } = message;
  
  // Handle /start command
  if (text === '/start') {
    // You can implement a welcome message here
    console.log(`User ${chat.id} started the bot`);
  }
  
  // Handle /help command
  if (text === '/help') {
    // You can implement help message here
    console.log(`User ${chat.id} requested help`);
  }
}

module.exports = handler;
