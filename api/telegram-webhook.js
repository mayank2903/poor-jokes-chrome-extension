/**
 * @fileoverview Telegram webhook handler for bot interactions
 */

const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { answerCallbackQuery, editMessage, sendSubmissionNotification } = require('../lib/telegram-notifications');
const { formatJokeContent, formatSubmitterName, validateJokeQuality } = require('../lib/joke-formatter');
const JokeGenerator = require('../lib/joke-generator');

// In-memory deduplication of Telegram updates to avoid repeated command processing
const processedUpdateIds = new Set();
const MAX_PROCESSED_IDS = 1000;

function rememberUpdateId(id) {
  processedUpdateIds.add(id);
  if (processedUpdateIds.size > MAX_PROCESSED_IDS) {
    const ids = Array.from(processedUpdateIds).slice(-MAX_PROCESSED_IDS);
    processedUpdateIds.clear();
    ids.forEach(x => processedUpdateIds.add(x));
  }
}

// Database-backed per-chat generation lock (works across serverless instances)
async function acquireChatLock(chatId, ttlSeconds = 60) {
  try {
    if (!supabase) return false;

    // Cleanup expired locks first
    const nowIso = new Date().toISOString();
    await supabase
      .from('generation_locks')
      .delete()
      .lt('expires_at', nowIso);

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const { error: insertError } = await supabase
      .from('generation_locks')
      .insert({ chat_id: String(chatId), expires_at: expiresAt });

    if (insertError) {
      // Duplicate key or table missing
      return false;
    }

    return true;
  } catch (e) {
    console.warn('acquireChatLock error:', e.message);
    return false;
  }
}

async function releaseChatLock(chatId) {
  try {
    if (!supabase) return;
    await supabase
      .from('generation_locks')
      .delete()
      .eq('chat_id', String(chatId));
  } catch (e) {
    console.warn('releaseChatLock error:', e.message);
  }
}

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
  const updateId = update && update.update_id;

  // Avoid re-processing duplicate updates retried by Telegram
  if (typeof updateId !== 'undefined' && processedUpdateIds.has(updateId)) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  // Handle callback query (button clicks)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }

  // Handle regular messages
  if (update.message) {
    await handleMessage(update.message);
  }

  if (typeof updateId !== 'undefined') {
    rememberUpdateId(updateId);
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
    const [action, identifier] = data.split('_');
    
    // Handle approve/reject submission actions
    if (action === 'approve' || action === 'reject') {
      if (!identifier) {
        await answerCallbackQuery(id, 'Invalid submission ID', true);
        return;
      }

      // Get submission from database
      const { data: submission, error: fetchError } = await supabase
        .from('joke_submissions')
        .select('*')
        .eq('id', identifier)
        .single();

      if (fetchError || !submission) {
        await answerCallbackQuery(id, 'Submission not found', true);
        return;
      }

      if (submission.status !== 'pending') {
        await answerCallbackQuery(id, 'Submission already reviewed', true);
        return;
      }

      if (action === 'approve') {
        await handleApproveSubmission(identifier, submission, id, chatId, messageId);
      } else {
        await handleRejectSubmission(identifier, submission, id, chatId, messageId);
      }
      return;
    }

    // Handle delete joke action from /worst list
    if (action === 'deletejoke') {
      const jokeId = identifier;
      if (!jokeId) {
        await answerCallbackQuery(id, 'Invalid joke ID', true);
        return;
      }

      try {
        // Delete ratings first to avoid FK constraints
        await supabase.from('joke_ratings').delete().eq('joke_id', jokeId);

        // Delete the joke
        const { error: deleteJokeError } = await supabase
          .from('jokes')
          .delete()
          .eq('id', jokeId);

        if (deleteJokeError) {
          throw deleteJokeError;
        }

        await answerCallbackQuery(id, `Joke ${jokeId} deleted`);

        // Update the message to reflect deletion
        const updated = `🗑️ Joke deleted (ID: \`${jokeId}\`)`;
        await editMessage(chatId, messageId, updated);
      } catch (err) {
        console.error('Error deleting joke:', err);
        await answerCallbackQuery(id, 'Failed to delete joke', true);
      }
      return;
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
    // Try to acquire a cross-instance lock; if not, fall back to in-memory guard
    let gotDbLock = await acquireChatLock(chat.id, 90);

    // In-memory fallback (best-effort)
    if (!globalThis.__activeJokesGenerationChats) {
      globalThis.__activeJokesGenerationChats = new Set();
    }
    const active = globalThis.__activeJokesGenerationChats;

    if (!gotDbLock && active.has(chat.id)) {
      await sendTelegramMessage(chat.id, '⏳ Already generating jokes for you. Please wait a moment.');
      return;
    }

    active.add(chat.id);

    generateJokesOnDemand(chat.id)
      .catch(err => console.error('Async generateJokesOnDemand error:', err))
      .finally(async () => {
        try { active.delete(chat.id); } catch (_) {}
        try { if (gotDbLock) await releaseChatLock(chat.id); } catch (_) {}
      });

    console.log(`User ${chat.id} requested jokes (async started)`);
  }
  
  // Handle /worst or /worst5 command - show most downvoted jokes
  else if (text === '/worst' || text === '/worst5') {
    await sendMostDownvotedJokes(chat.id, 5);
    console.log(`User ${chat.id} requested most downvoted jokes`);
  }
  
  // Handle /downvoted command (alias)
  else if (text === '/downvoted') {
    await sendMostDownvotedJokes(chat.id, 5);
    console.log(`User ${chat.id} requested most downvoted jokes (alias)`);
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
• /jokes - Generate 10 new AI-powered puns
• /worst - Show 5 most downvoted jokes
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
    await sendTelegramMessage(chatId, '🎭 Generating 10 new puns for you...');

    const generator = new JokeGenerator();
    const jokes = await generator.generateDailyJokes();
    
    console.log(`Generated ${jokes.length} jokes for user ${chatId}`);
    
    if (jokes.length === 0) {
      await sendTelegramMessage(chatId, '❌ Sorry, I couldn\'t generate any valid puns right now. Please try again later.');
      return;
    }

    // Generate and send jokes one at a time with overall timeout
    let submittedCount = 0;
    let attempts = 0;
    const maxAttempts = 40; // Increased to ensure we get 10 unique jokes
    const start = Date.now();
    const HARD_TIMEOUT_MS = 45_000; // Stop after 45s and send what we have
    
    while (submittedCount < 10 && attempts < maxAttempts && (Date.now() - start) < HARD_TIMEOUT_MS) {
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

      // Do not repeat previously rejected jokes or already approved jokes
      try {
        // Check against existing approved jokes (main table)
        const { data: existingSame, error: existingErr } = await supabase
          .from('jokes')
          .select('id, content')
          .ilike('content', joke.content);
        if (!existingErr && existingSame && existingSame.length > 0) {
          console.log('Joke already exists in jokes table, skipping');
          continue;
        }

        // Check against previously rejected submissions
        const { data: rejectedSame, error: rejectedErr } = await supabase
          .from('joke_submissions')
          .select('id, content, status')
          .eq('status', 'rejected')
          .ilike('content', joke.content);
        if (!rejectedErr && rejectedSame && rejectedSame.length > 0) {
          console.log('Joke was previously rejected, skipping');
          continue;
        }
      } catch (checkErr) {
        console.warn('Error checking repeats/rejections, proceeding cautiously:', checkErr.message);
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
        
        // Small delay between jokes to avoid flooding
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
 * Send the most downvoted jokes
 * @param {string} chatId - Chat ID
 * @param {number} limit - Number of jokes to show
 */
async function sendMostDownvotedJokes(chatId, limit = 5) {
  try {
    if (!supabase) {
      await sendTelegramMessage(chatId, '❌ Database not available. Please check your configuration.');
      return;
    }

    // Fetch all downvote ratings (rating = -1)
    const { data: downvoteRows, error: downvoteError } = await supabase
      .from('joke_ratings')
      .select('joke_id, rating')
      .eq('rating', -1);

    if (downvoteError) {
      throw downvoteError;
    }

    if (!downvoteRows || downvoteRows.length === 0) {
      await sendTelegramMessage(chatId, '👍 No downvotes yet. Your jokes are crushing it!');
      return;
    }

    // Aggregate downvotes by joke_id
    const downvoteCountByJokeId = new Map();
    for (const row of downvoteRows) {
      const current = downvoteCountByJokeId.get(row.joke_id) || 0;
      downvoteCountByJokeId.set(row.joke_id, current + 1);
    }

    // Sort by downvote count desc, take top N
    const topEntries = Array.from(downvoteCountByJokeId.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const topIds = topEntries.map(([jokeId]) => jokeId);
    if (topIds.length === 0) {
      await sendTelegramMessage(chatId, '👍 No downvotes yet. Your jokes are crushing it!');
      return;
    }

    // Fetch the joke contents
    const { data: jokes, error: jokesError } = await supabase
      .from('jokes')
      .select('id, content')
      .in('id', topIds);

    if (jokesError) {
      throw jokesError;
    }

    // Build a lookup for content
    const jokeById = new Map(jokes.map(j => [j.id, j]));

    // Send one message per joke with a Delete button
    for (let i = 0; i < topEntries.length; i++) {
      const [jokeId, count] = topEntries[i];
      const joke = jokeById.get(jokeId);
      const text = joke && joke.content ? joke.content : '(content not found)';

      const message = `📉 *Downvoted Joke #${i + 1}*\n\n👎 Downvotes: ${count}\n\n📝\n"${text}"\n\nID: \`${jokeId}\``;

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

      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (!TELEGRAM_BOT_TOKEN) {
        await sendTelegramMessage(chatId, message);
        continue;
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🗑️ Delete', callback_data: `deletejoke_${jokeId}` }
          ]
        ]
      };

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      });
    }
  } catch (error) {
    console.error('Error sending most downvoted jokes:', error);
    await sendTelegramMessage(chatId, '❌ Failed to fetch downvoted jokes. Please try again later.');
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
