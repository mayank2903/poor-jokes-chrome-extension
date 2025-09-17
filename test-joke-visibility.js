#!/usr/bin/env node

/**
 * Test Joke Visibility - Check if specific jokes are being loaded
 */

const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, url });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, url });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testJokeVisibility() {
  console.log('🔍 Testing Joke Visibility...');
  console.log('Looking for: "You look great today!"');
  console.log('=' .repeat(60));
  
  try {
    // Get all jokes from API
    const response = await makeRequest('https://poor-jokes-newtab.vercel.app/api/jokes');
    
    if (response.status === 200 && response.data.success) {
      const jokes = response.data.jokes;
      console.log(`📊 Total jokes in database: ${jokes.length}`);
      
      // Look for the specific joke
      const targetJoke = jokes.find(joke => 
        joke.content.toLowerCase().includes('you look great today')
      );
      
      if (targetJoke) {
        console.log('✅ Found your joke in the database!');
        console.log(`   ID: ${targetJoke.id}`);
        console.log(`   Content: "${targetJoke.content}"`);
        console.log(`   Upvotes: ${targetJoke.up_votes}`);
        console.log(`   Downvotes: ${targetJoke.down_votes}`);
        console.log(`   Rating: ${targetJoke.rating_percentage}%`);
        console.log(`   Created: ${targetJoke.created_at}`);
        
        // Check if it's active
        if (targetJoke.up_votes > 0 || targetJoke.rating_percentage > 0) {
          console.log('✅ Joke is active and has ratings');
        } else {
          console.log('⚠️  Joke is active but has no ratings yet');
        }
        
        // Show some other recent jokes for comparison
        console.log('\n📋 Recent jokes in database:');
        const recentJokes = jokes.slice(0, 5);
        recentJokes.forEach((joke, index) => {
          console.log(`   ${index + 1}. "${joke.content}" (${joke.rating_percentage}% rating)`);
        });
        
      } else {
        console.log('❌ Your joke was not found in the database');
        console.log('\n🔍 Searching for similar jokes...');
        
        const similarJokes = jokes.filter(joke => 
          joke.content.toLowerCase().includes('great') ||
          joke.content.toLowerCase().includes('look') ||
          joke.content.toLowerCase().includes('today')
        );
        
        if (similarJokes.length > 0) {
          console.log('Found similar jokes:');
          similarJokes.forEach((joke, index) => {
            console.log(`   ${index + 1}. "${joke.content}"`);
          });
        } else {
          console.log('No similar jokes found');
        }
      }
      
    } else {
      console.log('❌ Failed to fetch jokes from API');
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing joke visibility:', error.message);
  }
}

async function testJokeSelection() {
  console.log('\n🎯 Testing Joke Selection Algorithm...');
  console.log('=' .repeat(60));
  
  try {
    // Simulate the joke selection process
    const response = await makeRequest('https://poor-jokes-newtab.vercel.app/api/jokes');
    
    if (response.status === 200 && response.data.success) {
      const jokes = response.data.jokes;
      const targetJoke = jokes.find(joke => 
        joke.content.toLowerCase().includes('you look great today')
      );
      
      if (targetJoke) {
        console.log('✅ Your joke is available for selection');
        
        // Simulate weighted selection
        const unseenJokes = jokes.filter(joke => joke.id !== targetJoke.id);
        const unseenCount = unseenJokes.length;
        const totalJokes = jokes.length;
        
        console.log(`📊 Selection stats:`);
        console.log(`   Total jokes: ${totalJokes}`);
        console.log(`   Unseen jokes: ${unseenCount}`);
        console.log(`   Your joke chance: ${Math.round((1/totalJokes) * 100)}% (random)`);
        
        // Test multiple selections
        console.log('\n🎲 Simulating 10 joke selections:');
        for (let i = 0; i < 10; i++) {
          const randomIndex = Math.floor(Math.random() * jokes.length);
          const selectedJoke = jokes[randomIndex];
          const isYourJoke = selectedJoke.id === targetJoke.id;
          console.log(`   ${i + 1}. ${isYourJoke ? '🎯 YOUR JOKE' : 'Other'}: "${selectedJoke.content.substring(0, 50)}..."`);
        }
        
      } else {
        console.log('❌ Your joke is not available for selection');
      }
    }
    
  } catch (error) {
    console.log('❌ Error testing joke selection:', error.message);
  }
}

async function main() {
  console.log('🚀 Joke Visibility Test');
  console.log('=' .repeat(60));
  
  await testJokeVisibility();
  await testJokeSelection();
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Clear your browser cache and reload the extension');
  console.log('2. Open a new tab to trigger fresh joke loading');
  console.log('3. Check the browser console for API requests');
  console.log('4. Try the refresh button in the extension');
  console.log('5. Your joke might appear after a few more tab opens');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testJokeVisibility, testJokeSelection };
