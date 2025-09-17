// Poor Jokes New Tab Extension - Enhanced with APIManager
// This version uses the new API management system

// DOM Elements
const jokeEl = document.getElementById('joke');
const nextJokeBtn = document.getElementById('another');
const copyBtn = document.getElementById('copy');
const refreshBtn = document.getElementById('refresh');
const thumbsUpBtn = document.getElementById('thumbs-up');
const thumbsDownBtn = document.getElementById('thumbs-down');
const upCountEl = document.getElementById('up-count');
const downCountEl = document.getElementById('down-count');
const ratingStatsEl = document.getElementById('rating-stats');
const submitJokeBtn = document.getElementById('submit-joke-btn');
const submissionForm = document.getElementById('submission-form');
const jokeTextarea = document.getElementById('joke-textarea');
const submitJoke = document.getElementById('submit-joke');
const cancelSubmission = document.getElementById('cancel-submission');
const submissionStatus = document.getElementById('submission-status');

// Global state
let currentJoke = null;
let allJokes = [];
let userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');
let userId = localStorage.getItem('userId') || generateUserId();

// Cache configuration
const CACHE_CONFIG = {
  JOKES_KEY: 'poorJokes_cache',
  LAST_FETCH_KEY: 'poorJokes_lastFetch',
  REFRESH_INTERVAL: 3600000, // 1 hour in milliseconds
  MAX_CACHE_AGE: 86400000 // 24 hours max cache age
};

// Display history configuration
const DISPLAY_CONFIG = {
  HISTORY_KEY: 'poorJokes_displayHistory',
  MAX_HISTORY_SIZE: 20, // Keep track of last 20 shown jokes
  UNSEEN_WEIGHT: 10,    // Weight for jokes not shown recently
  RECENT_WEIGHT: 1,     // Weight for recently shown jokes
  RESET_THRESHOLD: 0.8  // Reset history when 80% of jokes have been shown
};

// Generate unique user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Cache management functions
function getCachedJokes() {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.JOKES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate cache structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Error reading cached jokes:', error);
  }
  return [];
}

function cacheJokes(jokes) {
  try {
    localStorage.setItem(CACHE_CONFIG.JOKES_KEY, JSON.stringify(jokes));
    setLastFetchTime();
    console.log('✅ Cached jokes:', jokes.length);
  } catch (error) {
    console.warn('Error caching jokes:', error);
  }
}

function getLastFetchTime() {
  try {
    const lastFetch = localStorage.getItem(CACHE_CONFIG.LAST_FETCH_KEY);
    return lastFetch ? parseInt(lastFetch, 10) : null;
  } catch (error) {
    console.warn('Error reading last fetch time:', error);
    return null;
  }
}

function setLastFetchTime() {
  try {
    localStorage.setItem(CACHE_CONFIG.LAST_FETCH_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Error setting last fetch time:', error);
  }
}

function shouldRefreshJokes() {
  const lastFetch = getLastFetchTime();
  const now = Date.now();
  
  // Always refresh if:
  // - Never fetched before
  // - Cache is empty
  // - Cache is too old (24 hours)
  if (!lastFetch || allJokes.length === 0) {
    return true;
  }
  
  const timeSinceLastFetch = now - lastFetch;
  const isTooOld = timeSinceLastFetch > CACHE_CONFIG.MAX_CACHE_AGE;
  const shouldRefresh = timeSinceLastFetch > CACHE_CONFIG.REFRESH_INTERVAL;
  
  if (isTooOld) {
    console.log('🔄 Cache too old, refreshing...');
    return true;
  }
  
  if (shouldRefresh) {
    console.log('🔄 Cache refresh interval reached, refreshing...');
    return true;
  }
  
  console.log('✅ Using cached jokes (fresh)');
  return false;
}

function clearJokeCache() {
  try {
    localStorage.removeItem(CACHE_CONFIG.JOKES_KEY);
    localStorage.removeItem(CACHE_CONFIG.LAST_FETCH_KEY);
    console.log('🗑️ Joke cache cleared');
  } catch (error) {
    console.warn('Error clearing joke cache:', error);
  }
}

// Manual refresh function for users
async function refreshJokes() {
  console.log('🔄 Manual refresh requested...');
  clearJokeCache();
  clearDisplayHistory(); // Clear display history when refreshing
  await loadJokes();
}

// Display history management functions
function getDisplayHistory() {
  try {
    const history = localStorage.getItem(DISPLAY_CONFIG.HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.warn('Error reading display history:', error);
    return [];
  }
}

function addToDisplayHistory(jokeId) {
  try {
    let history = getDisplayHistory();
    
    // Remove if already exists (to move to end)
    history = history.filter(id => id !== jokeId);
    
    // Add to end
    history.push(jokeId);
    
    // Keep only the last MAX_HISTORY_SIZE entries
    if (history.length > DISPLAY_CONFIG.MAX_HISTORY_SIZE) {
      history = history.slice(-DISPLAY_CONFIG.MAX_HISTORY_SIZE);
    }
    
    localStorage.setItem(DISPLAY_CONFIG.HISTORY_KEY, JSON.stringify(history));
    console.log('📝 Added to display history:', jokeId);
  } catch (error) {
    console.warn('Error updating display history:', error);
  }
}

function shouldResetHistory() {
  const history = getDisplayHistory();
  const totalJokes = allJokes.length;
  
  if (totalJokes === 0) return false;
  
  const historyPercentage = history.length / totalJokes;
  return historyPercentage >= DISPLAY_CONFIG.RESET_THRESHOLD;
}

function clearDisplayHistory() {
  try {
    localStorage.removeItem(DISPLAY_CONFIG.HISTORY_KEY);
    console.log('🗑️ Display history cleared');
  } catch (error) {
    console.warn('Error clearing display history:', error);
  }
}

function getWeightedJokeSelection() {
  if (allJokes.length === 0) return null;
  
  const history = getDisplayHistory();
  const unseenJokes = allJokes.filter(joke => !history.includes(joke.id));
  
  // If we have unseen jokes, prioritize them heavily
  if (unseenJokes.length > 0) {
    console.log(`🎯 Found ${unseenJokes.length} unseen jokes, prioritizing them`);
    return unseenJokes[Math.floor(Math.random() * unseenJokes.length)];
  }
  
  // If all jokes have been seen recently, use weighted selection
  console.log('⚖️ All jokes seen recently, using weighted selection');
  
  const weights = allJokes.map(joke => {
    const isRecent = history.includes(joke.id);
    return isRecent ? DISPLAY_CONFIG.RECENT_WEIGHT : DISPLAY_CONFIG.UNSEEN_WEIGHT;
  });
  
  // Weighted random selection
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < allJokes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return allJokes[i];
    }
  }
  
  // Fallback to random selection
  return allJokes[Math.floor(Math.random() * allJokes.length)];
}

// Load jokes using hybrid caching strategy
async function loadJokes() {
  console.log('🔄 Loading jokes with hybrid caching...');
  
  // 1. Try to load cached jokes first for instant UX
  const cachedJokes = getCachedJokes();
  if (cachedJokes.length > 0) {
    allJokes = cachedJokes;
    showRandomJoke();
    console.log('⚡ Loaded cached jokes instantly:', cachedJokes.length);
  } else {
    // 2. Fallback to local jokes if no cache
    if (POOR_JOKES && POOR_JOKES.length > 0) {
      allJokes = POOR_JOKES.map((content, index) => ({
        id: `local_${index}`,
        content: content,
        up_votes: 0,
        down_votes: 0,
        total_votes: 0,
        rating_percentage: 0
      }));
      showRandomJoke();
      console.log('✅ Loaded local jokes as fallback');
    }
  }
  
  // 3. Check if we should refresh from API
  const needsRefresh = shouldRefreshJokes();
  
  if (needsRefresh) {
    console.log('🌐 Fetching fresh jokes from API...');
    
    try {
      const data = await window.APIManager.request('/jokes');
      
      if (data.success && data.jokes && data.jokes.length > 0) {
        allJokes = data.jokes;
        cacheJokes(data.jokes);
        
        // Only change the displayed joke if we had no cached jokes
        if (cachedJokes.length === 0) {
          showRandomJoke();
        }
        
        console.log('✅ Loaded fresh jokes from API:', data.jokes.length);
      } else {
        console.warn('API returned no jokes or failed:', data);
      }
    } catch (error) {
      console.error('Error loading jokes from API:', error);
      // Keep using cached or local jokes as fallback
    }
  }
  
  // 4. Final fallback if no jokes available
  if (allJokes.length === 0) {
    console.error('No jokes available from any source');
    if (jokeEl) {
      jokeEl.textContent = 'Sorry, no jokes available right now. Please try again later.';
    }
  }
}

// Show random joke with smart prioritization
function showRandomJoke() {
  if (allJokes.length === 0) return;
  
  // Check if we should reset history (when most jokes have been shown)
  if (shouldResetHistory()) {
    console.log('🔄 Resetting display history - most jokes have been shown');
    clearDisplayHistory();
  }
  
  // Use weighted selection to prioritize unseen jokes
  const selectedJoke = getWeightedJokeSelection();
  
  if (selectedJoke) {
    // Add to display history
    addToDisplayHistory(selectedJoke.id);
    
    // Show the selected joke
    showJoke(selectedJoke);
    
    // Log selection info for debugging
    const history = getDisplayHistory();
    const unseenCount = allJokes.filter(joke => !history.includes(joke.id)).length;
    console.log(`📊 Joke selection stats: ${unseenCount} unseen, ${history.length} in history`);
  }
}

// Show specific joke
function showJoke(joke) {
  currentJoke = joke;
  jokeEl.textContent = joke.content;
  updateRatingDisplay();
}

// Update rating display
function updateRatingDisplay() {
  if (!currentJoke) return;
  
  // Display current ratings from API
  upCountEl.textContent = currentJoke.up_votes || 0;
  downCountEl.textContent = currentJoke.down_votes || 0;
  
  // Check if user has rated this joke
  const userRating = userRatings[currentJoke.id];
  thumbsUpBtn.classList.toggle('rated', userRating === 1);
  thumbsDownBtn.classList.toggle('rated', userRating === -1);
  
  // Show rating stats
  const total = currentJoke.total_votes || 0;
  if (total > 0) {
    const percentage = currentJoke.rating_percentage || 0;
    ratingStatsEl.textContent = `${percentage}% liked this joke (${total} ratings)`;
  } else {
    ratingStatsEl.textContent = 'Be the first to rate this joke!';
  }
}

// Update ratings for the current joke without changing the joke
async function updateCurrentJokeRatings() {
  if (!currentJoke) return;
  
  try {
    const data = await window.APIManager.request('/jokes');
    
    if (data.success) {
      // Find the current joke in the updated list
      const updatedJoke = data.jokes.find(joke => joke.id === currentJoke.id);
      if (updatedJoke) {
        // Update the current joke's rating data
        currentJoke.up_votes = updatedJoke.up_votes;
        currentJoke.down_votes = updatedJoke.down_votes;
        currentJoke.total_votes = updatedJoke.total_votes;
        currentJoke.rating_percentage = updatedJoke.rating_percentage;
        
        // Update the display
        updateRatingDisplay();
      }
    }
  } catch (error) {
    console.error('Error updating joke ratings:', error);
  }
}

// Rate a joke
async function rateJoke(rating) {
  if (!currentJoke) return;
  
  const ratingValue = rating === 'up' ? 1 : -1;
  const previousRating = userRatings[currentJoke.id];
  
  try {
    const data = await window.APIManager.request('/rate', {
      method: 'POST',
      body: JSON.stringify({
        joke_id: currentJoke.id,
        user_id: userId,
        rating: ratingValue
      })
    });
    
    if (data.success) {
      // Update local user ratings
      if (data.action === 'removed') {
        delete userRatings[currentJoke.id];
      } else {
        userRatings[currentJoke.id] = ratingValue;
      }
      
      // Save to localStorage
      localStorage.setItem('userRatings', JSON.stringify(userRatings));
      
      // Update the current joke's rating display without changing the joke
      await updateCurrentJokeRatings();
    } else {
      console.error('Failed to rate joke:', data.error);
    }
  } catch (error) {
    console.error('Error rating joke:', error);
    // Fallback to local rating for offline mode
    if (previousRating === ratingValue) {
      delete userRatings[currentJoke.id];
    } else {
      userRatings[currentJoke.id] = ratingValue;
    }
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    updateRatingDisplay();
  }
}

// Show submission form
function showSubmissionForm() {
  submissionForm.style.display = 'block';
  submitJokeBtn.style.display = 'none';
  jokeTextarea.focus();
}

// Hide submission form
function hideSubmissionForm() {
  submissionForm.style.display = 'none';
  submitJokeBtn.style.display = 'block';
  jokeTextarea.value = '';
  submissionStatus.textContent = '';
}

// Submit joke to API
async function submitJokeToAPI() {
  const content = jokeTextarea.value.trim();
  
  if (!content) {
    submissionStatus.textContent = 'Please enter a joke!';
    submissionStatus.className = 'submission-status error';
    return;
  }
  
  if (content.length > 500) {
    submissionStatus.textContent = 'Joke is too long (max 500 characters)';
    submissionStatus.className = 'submission-status error';
    return;
  }
  
  submissionStatus.textContent = 'Submitting joke...';
  submissionStatus.className = 'submission-status loading';
  submitJoke.disabled = true;
  
  try {
    const data = await window.APIManager.request('/jokes', {
      method: 'POST',
      body: JSON.stringify({
        content: content,
        submitted_by: userId
      })
    });
    
    if (data.success) {
      submissionStatus.textContent = 'Joke submitted successfully! It will be reviewed before being added.';
      submissionStatus.className = 'submission-status success';
      jokeTextarea.value = '';
      setTimeout(() => {
        hideSubmissionForm();
      }, 2000);
    } else {
      throw new Error(data.error || 'Failed to submit joke');
    }
  } catch (error) {
    console.error('Error submitting joke:', error);
    submissionStatus.textContent = `Error: ${error.message}`;
    submissionStatus.className = 'submission-status error';
  } finally {
    submitJoke.disabled = false;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing newtab-v2.js');
  
  // Check if required elements exist
  const requiredElements = {
    jokeEl,
    nextJokeBtn,
    copyBtn,
    refreshBtn,
    thumbsUpBtn,
    thumbsDownBtn,
    upCountEl,
    downCountEl,
    ratingStatsEl,
    submitJokeBtn,
    submissionForm,
    jokeTextarea,
    submitJoke,
    cancelSubmission,
    submissionStatus
  };
  
  // Log missing elements for debugging
  Object.entries(requiredElements).forEach(([name, element]) => {
    if (!element) {
      console.error(`Missing required element: ${name}`);
    }
  });
  
  // Set up event listeners after DOM is loaded
  if (nextJokeBtn) {
    nextJokeBtn.addEventListener('click', showRandomJoke);
    console.log('Added event listener to nextJokeBtn');
  }
  
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jokeEl.textContent);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
      } catch (err) {
        console.error('Copy failed', err);
        copyBtn.textContent = 'Copy failed';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
      }
    });
    console.log('Added event listener to copyBtn');
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '⏳';
      refreshBtn.disabled = true;
      try {
        await refreshJokes();
        refreshBtn.textContent = '✅';
        
        // Show stats in console for debugging
        const history = getDisplayHistory();
        const unseenCount = allJokes.filter(joke => !history.includes(joke.id)).length;
        console.log(`📊 After refresh: ${unseenCount} unseen jokes, ${history.length} in history`);
        
        setTimeout(() => (refreshBtn.textContent = '🔄'), 2000);
      } catch (error) {
        console.error('Refresh failed:', error);
        refreshBtn.textContent = '❌';
        setTimeout(() => (refreshBtn.textContent = '🔄'), 2000);
      } finally {
        refreshBtn.disabled = false;
      }
    });
    console.log('Added event listener to refreshBtn');
  }
  
  if (thumbsUpBtn) {
    thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
    console.log('Added event listener to thumbsUpBtn');
  }
  
  if (thumbsDownBtn) {
    thumbsDownBtn.addEventListener('click', () => rateJoke('down'));
    console.log('Added event listener to thumbsDownBtn');
  }
  
  if (submitJokeBtn) {
    submitJokeBtn.addEventListener('click', showSubmissionForm);
    console.log('Added event listener to submitJokeBtn');
  }
  
  if (cancelSubmission) {
    cancelSubmission.addEventListener('click', hideSubmissionForm);
    console.log('Added event listener to cancelSubmission');
  }
  
  if (submitJoke) {
    submitJoke.addEventListener('click', submitJokeToAPI);
    console.log('Added event listener to submitJoke');
  }
  
  // Load jokes immediately - don't wait for APIManager
  loadJokes();
});

// Save user ID
localStorage.setItem('userId', userId);
