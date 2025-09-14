/**
 * Test script for Telegram notification flow
 */

const fetch = require('node-fetch');

const API_BASE = 'https://poor-jokes-newtab-kcr9acwtg-mayanks-projects-72f678fa.vercel.app';

async function testTelegramFlow() {
  console.log('🧪 Testing Telegram Flow...\n');

  try {
    // 1. Test webhook endpoint
    console.log('1️⃣ Testing webhook endpoint...');
    const webhookResponse = await fetch(`${API_BASE}/api/telegram-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'webhook' })
    });
    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook:', webhookResult);

    // 2. Submit a test joke
    console.log('\n2️⃣ Submitting test joke...');
    const jokeResponse = await fetch(`${API_BASE}/api/jokes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: "Why did the Telegram bot go to therapy? Because it had too many callback queries!",
        submitted_by: "Test User"
      })
    });
    const jokeResult = await jokeResponse.json();
    console.log('✅ Joke submitted:', jokeResult);

    if (jokeResult.submission_id) {
      console.log(`\n📱 Check your Telegram bot for notification with submission ID: ${jokeResult.submission_id}`);
      console.log('🔘 You should see buttons: [✅ Approve] [❌ Reject] [👀 Admin Dashboard]');
    }

    // 3. Test admin dashboard
    console.log('\n3️⃣ Testing admin dashboard...');
    const adminResponse = await fetch(`${API_BASE}/admin`);
    console.log('✅ Admin dashboard accessible:', adminResponse.status === 200 ? 'Yes' : 'No');

    // 4. Test API status
    console.log('\n4️⃣ Testing API status...');
    const statusResponse = await fetch(`${API_BASE}/api`);
    const statusResult = await statusResponse.json();
    console.log('✅ API status:', statusResult);

    console.log('\n🎉 Telegram flow test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel');
    console.log('2. Redeploy to activate Telegram notifications');
    console.log('3. Submit another joke to see the Telegram message');
    console.log('4. Click the approve/reject buttons to test functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTelegramFlow();
