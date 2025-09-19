#!/usr/bin/env node
/**
 * Test script for daily joke generation system
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'https://poor-jokes-newtab.vercel.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'PoorJokes2024!Admin';

async function testDailyJokes() {
  console.log('🧪 Testing Daily Joke Generation System...');
  console.log('==========================================\n');

  try {
    // Test 1: Check daily stats
    console.log('📊 Test 1: Checking daily stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/daily-jokes`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('✅ Daily stats API working');
      console.log(`   Today's submissions: ${statsData.stats.today.total}`);
      console.log(`   Pending: ${statsData.stats.today.pending}`);
      console.log(`   Approved: ${statsData.stats.today.approved}`);
      console.log(`   Rejected: ${statsData.stats.today.rejected}`);
    } else {
      console.log('❌ Daily stats API failed:', statsData.message);
    }

    console.log('\n');

    // Test 2: Generate jokes (requires admin password)
    console.log('🎭 Test 2: Generating daily jokes...');
    const generateResponse = await fetch(`${API_BASE_URL}/api/daily-jokes`, {
      method: 'POST',
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
        'Content-Type': 'application/json'
      }
    });

    const generateData = await generateResponse.json();
    
    if (generateData.success) {
      console.log('✅ Joke generation working');
      console.log(`   Generated: ${generateData.submissions} jokes`);
      console.log(`   Message: ${generateData.message}`);
    } else {
      console.log('❌ Joke generation failed:', generateData.message);
      if (generateData.error) {
        console.log(`   Error: ${generateData.error}`);
      }
    }

    console.log('\n');

    // Test 3: Check if jokes were submitted
    console.log('🔍 Test 3: Verifying joke submissions...');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/daily-jokes`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      const newTotal = verifyData.stats.today.total;
      const newPending = verifyData.stats.today.pending;
      
      console.log('✅ Verification complete');
      console.log(`   Total submissions today: ${newTotal}`);
      console.log(`   Pending approval: ${newPending}`);
      
      if (newPending > 0) {
        console.log('   📱 Check your Telegram for approval notifications!');
      }
    } else {
      console.log('❌ Verification failed:', verifyData.message);
    }

    console.log('\n');

    // Test 4: Check API endpoints
    console.log('🌐 Test 4: Checking API endpoints...');
    
    const endpoints = [
      '/api/jokes',
      '/api/submissions',
      '/api/rate'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (response.ok) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`❌ ${endpoint} - ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Telegram for joke notifications');
    console.log('2. Approve/reject jokes using the buttons');
    console.log('3. Verify jokes appear in your extension');
    console.log('4. Set up environment variables for production');
    console.log('5. Deploy to Vercel to enable daily cron job');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDailyJokes();
}

module.exports = testDailyJokes;
