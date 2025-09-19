#!/usr/bin/env node
/**
 * Script to set up Telegram webhook
 */

const fetch = require('node-fetch');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'https://poor-jokes-newtab.vercel.app/api/telegram-webhook';

async function setupWebhook() {
  console.log('🔗 Setting up Telegram Webhook...');
  console.log('==================================\n');

  if (!TELEGRAM_BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    console.log('   Please set it in your Vercel environment variables first');
    console.log('\n📝 To set up manually:');
    console.log(`   1. Visit: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook`);
    console.log(`   2. With URL: ${WEBHOOK_URL}`);
    return;
  }

  try {
    console.log(`📡 Setting webhook URL: ${WEBHOOK_URL}`);
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`   URL: ${result.result.url}`);
      console.log('\n🎉 Your bot is now connected to your API!');
      console.log('\n📱 Test your bot:');
      console.log('   1. Open Telegram');
      console.log('   2. Find your bot');
      console.log('   3. Send: /start');
      console.log('   4. Send: /help');
      console.log('   5. Send: /jokes');
    } else {
      console.log('❌ Failed to set webhook:', result.description);
    }

  } catch (error) {
    console.log('❌ Error setting webhook:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  setupWebhook();
}

module.exports = setupWebhook;
