#!/usr/bin/env node
/**
 * Test script for on-demand joke generation via Telegram
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'https://poor-jokes-newtab.vercel.app';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function testTelegramJokes() {
  console.log('🧪 Testing On-Demand Joke Generation via Telegram...');
  console.log('====================================================\n');

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('❌ Telegram bot not configured');
    console.log('   Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables');
    return;
  }

  try {
    // Test 1: Send /start command
    console.log('📱 Test 1: Sending /start command...');
    await sendTelegramCommand('/start');
    console.log('✅ /start command sent');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Send /help command
    console.log('\n📱 Test 2: Sending /help command...');
    await sendTelegramCommand('/help');
    console.log('✅ /help command sent');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Send /jokes command
    console.log('\n🎭 Test 3: Sending /jokes command...');
    await sendTelegramCommand('/jokes');
    console.log('✅ /jokes command sent');

    console.log('\n🎉 Test completed!');
    console.log('\n📋 What to check:');
    console.log('1. Check your Telegram for the /start welcome message');
    console.log('2. Check your Telegram for the /help instructions');
    console.log('3. Check your Telegram for joke generation messages');
    console.log('4. Look for individual joke messages with approve/reject buttons');
    console.log('5. Test the approve/reject buttons');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Send a command to Telegram bot
 * @param {string} command - Command to send
 */
async function sendTelegramCommand(command) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: command
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   Message sent: ${result.result.message_id}`);
    } else {
      const error = await response.text();
      console.error(`   Failed to send command: ${error}`);
    }
  } catch (error) {
    console.error(`   Error sending command: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testTelegramJokes();
}

module.exports = testTelegramJokes;
