/**
 * @fileoverview Telegram bot notification service for joke submissions
 */

// Note: fetch is available globally in Vercel's Node.js 18+ environment

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_BASE_URL = process.env.API_URL || 'https://poor-jokes-newtab-7yprfgejg-mayanks-projects-72f678fa.vercel.app';

/**
 * Send Telegram notification for new joke submission
 * @param {Object} submission - Submission object
 */
async function sendSubmissionNotification(submission) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram bot not configured, skipping notification');
    return;
  }

  try {
    const message = `🎭 *New Joke Submission*

📝 *Joke Content:*
"${submission.content}"

📊 *Details:*
• ID: \`${submission.id}\`
• Submitted by: ${submission.submitted_by || 'Anonymous'}
• Submitted at: ${submission.created_at ? new Date(submission.created_at).toLocaleString() : new Date().toLocaleString()}
• Status: ⏳ Pending Review`;

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
        ],
        [
          {
            text: "👀 View Admin Dashboard",
            url: `${API_BASE_URL}/admin`
          }
        ]
      ]
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Telegram notification sent:', result.result.message_id);
    } else {
      const error = await response.text();
      console.error('Failed to send Telegram notification:', error);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

/**
 * Send Telegram notification for approved joke
 * @param {Object} submission - Submission object
 */
async function sendApprovalNotification(submission) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    const message = `✅ *Joke Approved*

📝 *Approved Joke:*
"${submission.content}"

📊 *Details:*
• ID: \`${submission.id}\`
• Originally submitted by: ${submission.submitted_by || 'Anonymous'}
• Approved at: ${new Date().toLocaleString()}
• Status: ✅ Approved`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    console.log('Approval notification sent');
  } catch (error) {
    console.error('Error sending approval notification:', error);
  }
}

/**
 * Send Telegram notification for rejected joke
 * @param {Object} submission - Submission object
 * @param {string} reason - Rejection reason
 */
async function sendRejectionNotification(submission, reason) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    const message = `❌ *Joke Rejected*

📝 *Rejected Joke:*
"${submission.content}"

📊 *Details:*
• ID: \`${submission.id}\`
• Originally submitted by: ${submission.submitted_by || 'Anonymous'}
• Rejected at: ${new Date().toLocaleString()}
• Reason: ${reason || 'No reason provided'}
• Status: ❌ Rejected`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    console.log('Rejection notification sent');
  } catch (error) {
    console.error('Error sending rejection notification:', error);
  }
}

/**
 * Answer Telegram callback query
 * @param {string} callbackQueryId - Callback query ID
 * @param {string} text - Response text
 * @param {boolean} showAlert - Whether to show alert
 */
async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

/**
 * Edit Telegram message
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {string} text - New text
 * @param {Object} keyboard - New keyboard
 */
async function editMessage(chatId, messageId, text, keyboard = null) {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    const body = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    };

    if (keyboard) {
      body.reply_markup = keyboard;
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error('Error editing message:', error);
  }
}

module.exports = {
  sendSubmissionNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  answerCallbackQuery,
  editMessage
};
