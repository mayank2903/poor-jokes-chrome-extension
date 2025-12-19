/**
 * Integration test to verify joke repeat prevention
 * Simulates a user continuously pressing "another" button until all jokes are exhausted
 * Fails if more than 10 jokes repeat during the journey
 */

// Mock DOM and localStorage for Node.js environment
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Set up globals before loading extension code
global.localStorage = mockLocalStorage;
global.window = {
  localStorage: mockLocalStorage
};

global.document = {
  getElementById: (id) => ({
    id,
    textContent: '',
    style: {},
    classList: {
      toggle: () => {},
      add: () => {},
      remove: () => {}
    },
    addEventListener: () => {},
    focus: () => {}
  }),
  body: {
    style: {}
  },
  addEventListener: () => {}
};

global.navigator = {
  clipboard: {
    writeText: async () => {}
  }
};

// Mock APIManager
const mockJokes = [];
let mockJokeId = 1;

// Initialize with a set of test jokes
function initializeMockJokes(count = 200) {
  mockJokes.length = 0;
  mockJokeId = 1;
  for (let i = 0; i < count; i++) {
    mockJokes.push({
      id: `joke-${mockJokeId++}`,
      content: `Test joke number ${i + 1}. This is a test joke.`,
      up_votes: 0,
      down_votes: 0,
      total_votes: 0,
      rating_percentage: 0
    });
  }
}

// Mock API responses - set up before loading extension code
global.window.APIManager = {
  request: async (url, options = {}) => {
    if (url.includes('/jokes')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '100');
      const start = (page - 1) * limit;
      const end = start + limit;
      const jokes = mockJokes.slice(start, end);
      
      return {
        success: true,
        jokes: jokes,
        pagination: {
          page: page,
          limit: limit,
          totalJokes: mockJokes.length,
          totalPages: Math.ceil(mockJokes.length / limit),
          hasNextPage: end < mockJokes.length,
          hasPrevPage: page > 1
        }
      };
    }
    
    if (url.includes('/rate')) {
      return { success: true };
    }
    
    return { success: true };
  }
};

// Load the extension code
const fs = require('fs');
const path = require('path');
const extensionCode = fs.readFileSync(
  path.join(__dirname, '../chrome-store-package/newtab-v2.js'),
  'utf8'
);

// Create a VM context to execute the extension code
const vm = require('vm');
const context = {
  window: global.window,
  document: global.document,
  navigator: global.navigator,
  localStorage: global.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  JSON: JSON,
  Math: Math,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  Promise: Promise,
  Error: Error,
  RegExp: RegExp,
  String: String,
  Number: Number,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent
};

// Make context properties available as globals
Object.keys(context).forEach(key => {
  global[key] = context[key];
});

// Execute the extension code
vm.createContext(context);
vm.runInContext(extensionCode, context);

// Export functions and variables from context for use in tests
const loadJokes = context.loadJokes;
const showRandomJoke = context.showRandomJoke;
const showJoke = context.showJoke;

// Test function
async function testJokeRepeatPrevention() {
  console.log('🧪 Starting joke repeat prevention test...');
  
  // Initialize with 200 test jokes
  initializeMockJokes(200);
  
  // Clear all localStorage
  window.localStorage.clear();
  
  // Get joke element
  const jokeEl = document.getElementById('joke');
  jokeEl.textContent = '';
  
  // Clear all localStorage
  window.localStorage.clear();
  
  // Track all jokes shown by ID (more reliable than content)
  const jokesShown = [];
  const jokeCounts = new Map();
  let repeatedJokes = 0;
  let totalJokesShown = 0;
  let consecutiveNoJokeCount = 0;
  const MAX_CONSECUTIVE_NO_JOKE = 5;
  
  // Helper to get current joke ID from context
  const getCurrentJokeId = () => {
    try {
      // Access currentJoke from the context (it's a global variable in the extension code)
      return context.currentJoke ? context.currentJoke.id : null;
    } catch (e) {
      return null;
    }
  };
  
  // Simulate loading jokes
  await loadJokes();
  
  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get initial joke
  await showRandomJoke();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate clicking "another" button repeatedly
  console.log('🔄 Simulating continuous "another" button clicks...');
  
  while (consecutiveNoJokeCount < MAX_CONSECUTIVE_NO_JOKE) {
    // Get current joke ID
    const currentJokeId = getCurrentJokeId();
    const currentText = jokeEl.textContent.trim();
    
    // Check if we've reached the end
    if (currentText.includes("You've seen all available jokes") && 
        !currentText.includes("Loading more...")) {
      console.log('✅ Reached end of all jokes');
      break;
    }
    
    // Track joke by ID if available
    if (currentJokeId) {
      jokesShown.push(currentJokeId);
      jokeCounts.set(currentJokeId, (jokeCounts.get(currentJokeId) || 0) + 1);
      
      const count = jokeCounts.get(currentJokeId);
      if (count > 1) {
        repeatedJokes++;
        const jokeContent = currentText.replace(/\n/g, ' ').substring(0, 50);
        console.log(`⚠️  Joke repeated (${count} times): ${currentJokeId} - ${jokeContent}...`);
      }
      
      totalJokesShown++;
      consecutiveNoJokeCount = 0;
    } else if (currentText && 
               currentText !== 'Loading joke...' &&
               currentText !== 'No jokes available. Please try again later.' &&
               currentText !== 'Error loading jokes. Please try again later.' &&
               !currentText.includes("You've seen all available jokes")) {
      // Fallback: track by content if ID not available
      const jokeContent = currentText.replace(/\n/g, ' ').trim();
      if (jokeContent) {
        jokesShown.push(jokeContent);
        jokeCounts.set(jokeContent, (jokeCounts.get(jokeContent) || 0) + 1);
        
        if (jokeCounts.get(jokeContent) > 1) {
          repeatedJokes++;
          console.log(`⚠️  Joke repeated (${jokeCounts.get(jokeContent)} times): ${jokeContent.substring(0, 50)}...`);
        }
        
        totalJokesShown++;
        consecutiveNoJokeCount = 0;
      } else {
        consecutiveNoJokeCount++;
      }
    } else {
      consecutiveNoJokeCount++;
    }
    
    // Simulate clicking "another" button
    await showRandomJoke();
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Safety check - don't run forever
    if (totalJokesShown > 500) {
      console.log('⚠️  Safety limit reached (500 jokes)');
      break;
    }
  }
  
  // Calculate statistics
  const uniqueJokes = new Set(jokesShown).size;
  const totalRepeats = Array.from(jokeCounts.values())
    .filter(count => count > 1)
    .reduce((sum, count) => sum + (count - 1), 0);
  
  console.log('\n📊 Test Results:');
  console.log(`   Total jokes shown: ${totalJokesShown}`);
  console.log(`   Unique jokes: ${uniqueJokes}`);
  console.log(`   Repeated jokes: ${repeatedJokes}`);
  console.log(`   Total repeat occurrences: ${totalRepeats}`);
  
  // Check if test passed
  const MAX_ALLOWED_REPEATS = 10;
  const passed = repeatedJokes <= MAX_ALLOWED_REPEATS;
  
  if (passed) {
    console.log(`\n✅ TEST PASSED: Only ${repeatedJokes} jokes repeated (limit: ${MAX_ALLOWED_REPEATS})`);
  } else {
    console.log(`\n❌ TEST FAILED: ${repeatedJokes} jokes repeated (limit: ${MAX_ALLOWED_REPEATS})`);
    console.log('\nRepeated jokes:');
    Array.from(jokeCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 20)
      .forEach(([content, count]) => {
        console.log(`   ${count}x: ${content.substring(0, 60)}...`);
      });
  }
  
  return passed;
}

// Run the test
if (require.main === module) {
  testJokeRepeatPrevention()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test error:', error);
      process.exit(1);
    });
}

module.exports = { testJokeRepeatPrevention };

