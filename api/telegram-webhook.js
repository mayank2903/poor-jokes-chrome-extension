/**
 * @fileoverview Telegram webhook handler for bot interactions
 */

const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { answerCallbackQuery, editMessage, sendSubmissionNotification } = require('../lib/telegram-notifications');
const { formatJokeContent, formatSubmitterName, validateJokeQuality } = require('../lib/joke-formatter');
const JokeGenerator = require('../lib/joke-generator');

// Initialize Supabase client with error handling
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } else {
    console.log('Supabase environment variables not configured');
  }
} catch (error) {
  console.error('Error initializing Supabase:', error);
}

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
  try {
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
  } catch (error) {
    console.error('Handler initialization error:', error);
    return res.status(500).json({ error: 'Handler initialization failed' });
  }
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
    // Check if Supabase is available
    if (!supabase) {
      await answerCallbackQuery(id, 'Database not available', true);
      return;
    }

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
    await sendWelcomeMessage(chat.id);
    console.log(`User ${chat.id} started the bot`);
  }
  
  // Handle /help command
  else if (text === '/help') {
    await sendHelpMessage(chat.id);
    console.log(`User ${chat.id} requested help`);
  }
  
  // Handle /jokes command
  else if (text === '/jokes') {
    await generateJokesOnDemand(chat.id);
    console.log(`User ${chat.id} requested jokes`);
  }
}

/**
 * Send welcome message
 * @param {string} chatId - Chat ID
 */
async function sendWelcomeMessage(chatId) {
    const message = `🎭 *Welcome to Poor Jokes Bot!*

I help you manage pun submissions and generate new puns on demand.

*Available Commands:*
• /jokes - Generate 5 new puns for approval
• /help - Show this help message
• /start - Welcome message

*How it works:*
1. Send /jokes to generate new puns
2. Review each pun with approve/reject buttons
3. Approved puns go to your collection

Ready to get some laughs? Send /jokes! 😄`;

  await sendTelegramMessage(chatId, message);
}

/**
 * Send help message
 * @param {string} chatId - Chat ID
 */
async function sendHelpMessage(chatId) {
  const message = `🤖 *Poor Jokes Bot Help*

*Commands:*
• /jokes - Generate 5 new AI-powered puns
• /help - Show this help message
• /start - Welcome message

*Features:*
✅ AI-generated high-quality puns
✅ Duplicate detection
✅ Quality filtering
✅ One-click approve/reject
✅ Automatic database integration

*Usage:*
1. Send \`/jokes\` to generate new puns
2. Review each pun with the buttons
3. Approved puns automatically go to your collection

Need more puns? Just send /jokes again! 🎭`;

  await sendTelegramMessage(chatId, message);
}

/**
 * Generate jokes on demand
 * @param {string} chatId - Chat ID
 */
async function generateJokesOnDemand(chatId) {
  try {
    // Check if Supabase is available
    if (!supabase) {
      await sendTelegramMessage(chatId, '❌ Database not available. Please check your configuration.');
      return;
    }

    // Send initial message
    await sendTelegramMessage(chatId, '🎭 Generating 5 new puns for you...\n⏳ Please wait while I create some clever wordplay!');

    const generator = new JokeGenerator();
    const jokes = await generator.generateDailyJokes();
    
    console.log(`Generated ${jokes.length} jokes for user ${chatId}`);
    
    if (jokes.length === 0) {
      await sendTelegramMessage(chatId, '❌ Sorry, I couldn\'t generate any valid puns right now. Please try again later.');
      return;
    }

    // Generate and send jokes one at a time
    let submittedCount = 0;
    let attempts = 0;
    const maxAttempts = 20; // Increased to ensure we get 5 unique jokes
    
    while (submittedCount < 5 && attempts < maxAttempts) {
      attempts++;
      
      // Generate a single joke
      const singleJoke = await generator.generateJokes();
      if (singleJoke.length === 0) {
        console.log('No jokes generated, trying again...');
        continue;
      }
      
      const joke = singleJoke[0]; // Take the first joke
      
      // Validate the joke
      if (!generator.validateJoke(joke)) {
        console.log('Joke failed validation, trying again...');
        continue;
      }
      
      // Check for duplicates
      const isDuplicate = await generator.isDuplicate(joke.content);
      if (isDuplicate) {
        console.log(`🚫 Duplicate found: "${joke.content.substring(0, 50)}..." - trying again`);
        continue;
      }
      
      try {
        // Submit to database
        const { data: submission, error } = await supabase
          .from('joke_submissions')
          .insert({
            content: joke.content,
            submitted_by: 'AI On-Demand Generator',
            status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('Error submitting joke to database:', error);
          console.error('Joke content:', joke.content);
          continue;
        }

        // Send immediately to user
        await sendSubmissionNotificationToUser(chatId, submission);
        submittedCount++;
        
        console.log(`✅ Submitted joke ${submittedCount}/5: ${joke.content.substring(0, 50)}...`);
        
        // Small delay between jokes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error processing joke:', error);
      }
    }

    // Send completion message
    const completionMessage = `🎉 *Pun Generation Complete!*

✅ Generated and submitted ${submittedCount} puns
📱 Check the messages above to approve/reject each pun
🎭 Approved puns will automatically go to your collection

Want more puns? Just send /jokes again!`;

    await sendTelegramMessage(chatId, completionMessage);

  } catch (error) {
    console.error('Error generating jokes on demand:', error);
    await sendTelegramMessage(chatId, '❌ Sorry, there was an error generating puns. Please try again later.');
  }
}

/**
 * Send submission notification to specific user
 * @param {string} chatId - Chat ID to send to
 * @param {Object} submission - Submission object
 */
async function sendSubmissionNotificationToUser(chatId, submission) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Telegram bot not configured, skipping notification');
    return;
  }

  try {
    // Check if joke already exists in the main jokes table
    let duplicateStatus = "🆕 New joke";
    if (supabase) {
      try {
        const normalizedContent = submission.content.toLowerCase().trim().replace(/\s+/g, ' ');
        const { data: existingJokes } = await supabase
          .from('jokes')
          .select('id, content')
          .ilike('content', normalizedContent);
        
        if (existingJokes && existingJokes.length > 0) {
          duplicateStatus = `⚠️ DUPLICATE - Already exists in database (${existingJokes.length} similar joke${existingJokes.length > 1 ? 's' : ''})`;
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error);
        duplicateStatus = "❓ Unable to check duplicates";
      }
    }

    const message = `🎭 *New Pun for Review*

📝 *Pun Content:*
"${submission.content}"

📊 *Details:*
• ID: \`${submission.id}\`
• Submitted by: ${submission.submitted_by || 'AI Generator'}
• Duplicate Check: ${duplicateStatus}
• Status: ⏳ Pending Your Approval`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve",
            callback_data: `approve_${submission.id}`
          },
          {
            text: "❌ Reject", 
            callback_data: `reject_${submission.id}`
          }
        ]
      ]
    };

    // Dynamic import for node-fetch
    let fetch;
    try {
      const fetchModule = await import('node-fetch');
      fetch = fetchModule.default;
    } catch (error) {
      if (typeof globalThis.fetch !== 'undefined') {
        fetch = globalThis.fetch;
      } else {
        throw new Error('Fetch not available');
      }
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Joke notification sent to user:', result.result.message_id);
    } else {
      const error = await response.text();
      console.error('Failed to send joke notification:', error);
    }
  } catch (error) {
    console.error('Error sending joke notification:', error);
  }
}

/**
 * Send a simple text message to Telegram
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 */
async function sendTelegramMessage(chatId, text) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Telegram bot not configured, skipping message');
    return;
  }

  try {
    // Dynamic import for node-fetch
    let fetch;
    try {
      const fetchModule = await import('node-fetch');
      fetch = fetchModule.default;
    } catch (error) {
      // Fallback to global fetch if available
      if (typeof globalThis.fetch !== 'undefined') {
        fetch = globalThis.fetch;
      } else {
        throw new Error('Fetch not available');
      }
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Telegram message sent:', result.result.message_id);
    } else {
      const error = await response.text();
      console.error('Failed to send Telegram message:', error);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

module.exports = handler;
