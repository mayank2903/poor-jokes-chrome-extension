// Poor Jokes New Tab Extension - Enhanced with APIManager
// This version uses the new API management system

// DOM Elements
const jokeEl = document.getElementById('joke');
const nextJokeBtn = document.getElementById('another');
const copyBtn = document.getElementById('copy');
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
let lastJokesLoad = 0;
const JOKES_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Pagination tracking
let totalJokesInDatabase = 0;
let currentPage = 1;
let totalPages = 1;
let isLoadingMoreJokes = false;

// Repeat prevention system
// Track both display history and when jokes were first seen
let displayHistory = JSON.parse(localStorage.getItem('poorJokes_displayHistory') || '[]');
let jokeFirstSeen = JSON.parse(localStorage.getItem('poorJokes_jokeFirstSeen') || '{}');
// Track all jokes that have been seen (bounded by active joke list)
let allSeenJokeIds = new Set(JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]'));
let lastJokeId = null;
const MAX_DISPLAY_HISTORY = 100; // Increased from 20 to prevent more repeats
const RECENT_JOKES_TO_AVOID = 50; // Increased from 10 to avoid more recent jokes

// Generate unique user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Load jokes from API with localStorage caching
async function loadJokes() {
  console.log('loadJokes() called');
  
  // Check if there's already a joke displayed in the DOM (to avoid replacing it)
  const hasDisplayedJoke = jokeEl && jokeEl.textContent && 
    jokeEl.textContent.trim() !== '' && 
    jokeEl.textContent !== 'Loading joke...' &&
    jokeEl.textContent !== 'No jokes available. Please try again later.' &&
    jokeEl.textContent !== "You've seen all available jokes! New jokes are added regularly." &&
    jokeEl.textContent !== "You've seen all available jokes! Loading more...";
  
  // Try to load cached jokes first for instant display
  try {
    const cachedData = localStorage.getItem('poorJokes_cachedJokes');
    const cachedTimestamp = localStorage.getItem('poorJokes_cacheTimestamp');
    
    if (cachedData && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp);
      const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
      
      if (cacheAge < CACHE_MAX_AGE) {
        const cachedJokes = JSON.parse(cachedData);
        if (cachedJokes && cachedJokes.length > 0) {
          allJokes = cachedJokes;
          console.log(`✅ Loaded ${cachedJokes.length} jokes from cache (${Math.round(cacheAge / 1000)}s old)`);
          
          // Only show a joke if there isn't one already displayed
          if (!currentJoke && !hasDisplayedJoke) {
            await showRandomJoke();
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error loading cached jokes:', error);
  }
  
  // Then fetch fresh jokes from API in background
  try {
    console.log('Loading jokes from API...');
    const data = await window.APIManager.request('/jokes?limit=100');
    
    if (data.success && data.jokes && data.jokes.length > 0) {
      allJokes = data.jokes;
      lastJokesLoad = Date.now();
      
      // Store pagination info
      if (data.pagination) {
        totalJokesInDatabase = data.pagination.totalJokes || 0;
        currentPage = data.pagination.page || 1;
        totalPages = data.pagination.totalPages || 1;
        console.log(`📊 Loaded ${allJokes.length} jokes (${totalJokesInDatabase} total available)`);
      }
      
      // Cache jokes in localStorage
      localStorage.setItem('poorJokes_cachedJokes', JSON.stringify(data.jokes));
      localStorage.setItem('poorJokes_cacheTimestamp', Date.now().toString());
      
      // Clean up allSeenJokeIds: remove IDs that don't exist in current joke set
      const currentJokeIds = new Set(allJokes.map(j => j.id));
      const beforeSize = allSeenJokeIds.size;
      
      // Filter to only keep IDs that exist in current joke set
      allSeenJokeIds = new Set([...allSeenJokeIds].filter(id => currentJokeIds.has(id)));
      
      const removedCount = beforeSize - allSeenJokeIds.size;
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} joke IDs that are no longer active`);
      }
      
      // Save cleaned up set
      localStorage.setItem('poorJokes_allSeenJokeIds', JSON.stringify([...allSeenJokeIds]));
      
      // Migrate jokeFirstSeen to allSeenJokeIds if needed (one-time migration)
      const firstSeenIds = Object.keys(jokeFirstSeen);
      if (firstSeenIds.length > 0) {
        let migratedCount = 0;
        firstSeenIds.forEach(id => {
          if (!allSeenJokeIds.has(id) && currentJokeIds.has(id)) {
            allSeenJokeIds.add(id);
            migratedCount++;
          }
        });
        if (migratedCount > 0) {
          localStorage.setItem('poorJokes_allSeenJokeIds', JSON.stringify([...allSeenJokeIds]));
          console.log(`🔄 Migrated ${migratedCount} jokes from jokeFirstSeen to allSeenJokeIds`);
        }
      }
      
      // Check for new jokes that haven't been seen before
      const newJokeCount = allJokes.filter(j => !allSeenJokeIds.has(j.id)).length;
      
      // Only show a new joke if we don't already have one displayed
      // Check both currentJoke state and existing DOM content to prevent replacing displayed jokes
      if (!currentJoke && !hasDisplayedJoke) {
        await showRandomJoke();
      }
      
      console.log(`✅ Loaded ${data.jokes.length} jokes from API (${newJokeCount} new)`);
    } else {
      console.warn('API returned no jokes or failed:', data);
      // If we have cached jokes, keep using them
      if (allJokes.length === 0 && jokeEl) {
        jokeEl.textContent = 'Sorry, no jokes available right now. Please try again later.';
      }
    }
  } catch (error) {
    console.error('Error loading jokes from API:', error);
    // If we have cached jokes, keep using them
    if (allJokes.length === 0 && jokeEl) {
      jokeEl.textContent = 'Error loading jokes. Please try again later.';
    }
  }
}

// Check if jokes need refresh and reload if necessary
async function checkAndRefreshJokes() {
  const now = Date.now();
  if (now - lastJokesLoad > JOKES_REFRESH_INTERVAL) {
    console.log('🔄 Refreshing jokes (older than 5 minutes)');
    // Reset pagination when refreshing
    currentPage = 1;
    await loadJokes();
  }
}

// Load more jokes from next page
async function loadMoreJokes() {
  // Check if already loading or no more pages
  if (isLoadingMoreJokes) {
    console.log('Already loading more jokes, skipping...');
    return false;
  }
  
  if (currentPage >= totalPages) {
    console.log(`No more jokes to load`);
    return false;
  }
  
  isLoadingMoreJokes = true;
  
  try {
    const nextPage = currentPage + 1;
    console.log(`📥 Loading more jokes...`);
    const data = await window.APIManager.request(`/jokes?page=${nextPage}&limit=100`);
    
    if (data.success && data.jokes && data.jokes.length > 0) {
      // Append new jokes to existing ones (avoid duplicates)
      const existingIds = new Set(allJokes.map(j => j.id));
      const newJokes = data.jokes.filter(j => !existingIds.has(j.id));
      
      allJokes = [...allJokes, ...newJokes];
      currentPage = nextPage;
      
      // Update pagination info
      if (data.pagination) {
        totalJokesInDatabase = data.pagination.totalJokes || totalJokesInDatabase;
        totalPages = data.pagination.totalPages || totalPages;
      }
      
      // Update cache with all jokes
      localStorage.setItem('poorJokes_cachedJokes', JSON.stringify(allJokes));
      
      console.log(`✅ Loaded ${newJokes.length} new jokes (total: ${allJokes.length}/${totalJokesInDatabase})`);
      return true;
    } else {
      console.warn('No more jokes available from API');
      return false;
    }
  } catch (error) {
    console.error('Error loading more jokes:', error);
    return false;
  } finally {
    isLoadingMoreJokes = false;
  }
}

// Show random joke with repeat prevention
async function showRandomJoke() {
  console.log('showRandomJoke() called, allJokes.length:', allJokes.length);
  
  if (allJokes.length === 0) {
    console.warn('No jokes available to show');
    if (jokeEl) {
      jokeEl.textContent = 'No jokes available. Please try again later.';
    }
    return;
  }
  
  // Get available jokes (not shown recently)
  const availableJokes = getAvailableJokes();
  
  if (availableJokes.length === 0) {
    // All jokes have been seen - check if there are truly no unseen jokes
    const unseenJokes = allJokes.filter(joke => !allSeenJokeIds.has(joke.id));
    
    if (unseenJokes.length === 0) {
      // User has seen all jokes from current batch
      console.log('📚 User has seen all loaded jokes');
      
      // Check if there are more jokes in database we haven't loaded
      const loadedJokesCount = allJokes.length;
      const hasMoreJokes = totalJokesInDatabase > 0 && loadedJokesCount < totalJokesInDatabase;
      
      if (hasMoreJokes) {
        // Automatically load more jokes
        console.log(`🔄 Auto-loading more jokes (${loadedJokesCount}/${totalJokesInDatabase} loaded)`);
        const loaded = await loadMoreJokes();
        
        if (loaded) {
          // Try again with newly loaded jokes
          const newAvailableJokes = getAvailableJokes();
          if (newAvailableJokes.length > 0) {
            const randomIndex = Math.floor(Math.random() * newAvailableJokes.length);
            showJoke(newAvailableJokes[randomIndex]);
            return;
          }
        }
      }
      
      // Either no more jokes, or we've loaded all jokes from database
      if (jokeEl) {
        if (totalJokesInDatabase > 0 && loadedJokesCount >= totalJokesInDatabase) {
          jokeEl.textContent = "You've seen all available jokes! New jokes are added regularly.";
        } else {
          jokeEl.textContent = "You've seen all available jokes! Loading more...";
        }
      }
      return;
    }
    
    // There are unseen jokes but they were filtered out by recent history
    // Reset display history and try again
    console.log('🔄 All jokes shown recently, resetting display history');
    displayHistory = [];
    localStorage.setItem('poorJokes_displayHistory', JSON.stringify(displayHistory));
    
    // Try again with all unseen jokes (except the last one shown)
    const allAvailableJokes = unseenJokes.filter(joke => joke.id !== lastJokeId);
    if (allAvailableJokes.length === 0) {
      // Only one unseen joke available, show it
      showJoke(unseenJokes[0]);
      return;
    }
    
    // Pick randomly from unseen jokes
    const randomIndex = Math.floor(Math.random() * allAvailableJokes.length);
    showJoke(allAvailableJokes[randomIndex]);
    return;
  }
  
  // Select random joke from available ones (all are unseen)
  const randomIndex = Math.floor(Math.random() * availableJokes.length);
  showJoke(availableJokes[randomIndex]);
}

// Get jokes that haven't been seen before (never-repeat system)
function getAvailableJokes() {
  // Filter out jokes that have been shown in the last N displays (for variety)
  const recentJokeIds = new Set(displayHistory.slice(-RECENT_JOKES_TO_AVOID));
  
  // Filter out ALL jokes that have been seen before (never-repeat)
  // Only return jokes that haven't been seen AND aren't in recent history
  const availableJokes = allJokes.filter(joke => {
    // Must not be in allSeenJokeIds (never seen before)
    if (allSeenJokeIds.has(joke.id)) {
      return false;
    }
    // Also avoid recent jokes for variety
    if (recentJokeIds.has(joke.id)) {
      return false;
    }
    return true;
  });
  
  return availableJokes;
}

// Format joke content with one sentence per line
function formatJokeContent(content) {
  if (!content) return '';
  
  // Split by sentence endings (. ! ?) followed by space or end of string
  // This regex splits on punctuation followed by optional whitespace
  const sentences = content
    .split(/([.!?]+)\s*/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
  
  // Recombine sentences with their punctuation
  const formattedSentences = [];
  for (let i = 0; i < sentences.length; i++) {
    const current = sentences[i];
    // Check if next item is punctuation
    if (i < sentences.length - 1 && /^[.!?]+$/.test(sentences[i + 1])) {
      // Combine sentence with its punctuation
      formattedSentences.push(current + sentences[i + 1]);
      i++; // Skip the punctuation since we combined it
    } else if (!/^[.!?]+$/.test(current)) {
      // It's a sentence without trailing punctuation (might be last sentence)
      formattedSentences.push(current);
    }
  }
  
  // If we didn't get proper sentences, return original content
  if (formattedSentences.length === 0) {
    return content;
  }
  
  // Join sentences with line breaks
  return formattedSentences.join('\n');
}

// Show specific joke
function showJoke(joke) {
  console.log('showJoke() called with:', joke);
  currentJoke = joke;
  
  // Track this joke in display history
  if (joke && joke.id) {
    // Track when joke was first seen (for analytics)
    if (!jokeFirstSeen[joke.id]) {
      jokeFirstSeen[joke.id] = Date.now();
      localStorage.setItem('poorJokes_jokeFirstSeen', JSON.stringify(jokeFirstSeen));
      console.log('🆕 First time seeing joke:', joke.id);
    }
    
    // Add to allSeenJokeIds (never-repeat tracking)
    if (!allSeenJokeIds.has(joke.id)) {
      allSeenJokeIds.add(joke.id);
      localStorage.setItem('poorJokes_allSeenJokeIds', JSON.stringify([...allSeenJokeIds]));
      console.log('📝 Added joke to allSeenJokeIds:', joke.id);
    }
    
    // Remove any existing entry for this joke to avoid duplicates in display history
    displayHistory = displayHistory.filter(id => id !== joke.id);
    
    // Add to end of history
    displayHistory.push(joke.id);
    
    // Keep only last N entries to prevent localStorage from growing too large
    if (displayHistory.length > MAX_DISPLAY_HISTORY) {
      displayHistory = displayHistory.slice(-MAX_DISPLAY_HISTORY);
    }
    
    // Save to localStorage
    localStorage.setItem('poorJokes_displayHistory', JSON.stringify(displayHistory));
    
    // Update last joke ID
    lastJokeId = joke.id;
    
    console.log('📊 Display history length:', displayHistory.length);
    console.log('📊 Total seen jokes:', allSeenJokeIds.size);
  }
  
  if (jokeEl) {
    const formattedContent = formatJokeContent(joke.content);
    jokeEl.textContent = formattedContent;
    console.log('Displayed joke:', joke.content);
  } else {
    console.error('jokeEl is null, cannot display joke');
  }
  
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

// Rate a joke with optimistic UI updates
async function rateJoke(rating) {
  if (!currentJoke) {
    console.log('No current joke to rate');
    return;
  }
  
  const ratingValue = rating === 'up' ? 1 : -1;
  const previousRating = userRatings[currentJoke.id];
  
  console.log('Rating joke:', {
    jokeId: currentJoke.id,
    rating: rating,
    ratingValue: ratingValue,
    previousRating: previousRating
  });
  
  // OPTIMISTIC UPDATE: Update UI immediately
  const wasRated = previousRating !== undefined;
  const isSameRating = previousRating === ratingValue;
  
  if (isSameRating) {
    // User clicked the same rating - remove it
    delete userRatings[currentJoke.id];
    // Update vote counts optimistically
    if (ratingValue === 1) {
      currentJoke.up_votes = Math.max(0, currentJoke.up_votes - 1);
    } else {
      currentJoke.down_votes = Math.max(0, currentJoke.down_votes - 1);
    }
  } else {
    // User clicked different rating or new rating
    if (wasRated) {
      // Switching from one rating to another
      if (previousRating === 1) {
        currentJoke.up_votes = Math.max(0, currentJoke.up_votes - 1);
      } else {
        currentJoke.down_votes = Math.max(0, currentJoke.down_votes - 1);
      }
    }
    
    // Add new rating
    userRatings[currentJoke.id] = ratingValue;
    if (ratingValue === 1) {
      currentJoke.up_votes += 1;
    } else {
      currentJoke.down_votes += 1;
    }
  }
  
  // Update total votes and percentage
  currentJoke.total_votes = currentJoke.up_votes + currentJoke.down_votes;
  currentJoke.rating_percentage = currentJoke.total_votes > 0 ? 
    Math.round((currentJoke.up_votes / currentJoke.total_votes) * 100) : 0;
  
  // Update UI immediately
  updateRatingDisplay();
  
  // Save to localStorage immediately
  localStorage.setItem('userRatings', JSON.stringify(userRatings));
  
  // Now sync with server in background
  try {
    const data = await window.APIManager.request('/rate', {
      method: 'POST',
      body: JSON.stringify({
        joke_id: currentJoke.id,
        user_id: userId,
        rating: ratingValue
      })
    });
    
    console.log('Rating API response:', data);
    
    if (data.success) {
      // Server confirmed the rating - update with server data
      await updateCurrentJokeRatings();
    } else {
      console.error('Failed to rate joke:', data.error);
      // Could show a subtle error message here if needed
    }
  } catch (error) {
    // Real joke rating failed - log the error
    console.error('Error rating joke:', error);
    // Rating was already updated optimistically, so user sees immediate feedback
    // Could show a subtle "offline" indicator if needed
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
  submitJokeBtn.style.display = 'inline-block';
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

// Generate daily random background color based on date
function setDailyBackground() {
  // Get today's date as a seed (YYYY-MM-DD format)
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  
  // Create a simple hash from the date string for consistent color generation
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate two colors for gradient based on the hash
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60 + Math.abs(hash % 120)) % 360; // Complementary color with variation
  
  // Use HSL for vibrant colors, with good saturation and lightness
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80% saturation
  const lightness1 = 50 + (Math.abs(hash) % 15); // 50-65% lightness
  const lightness2 = 45 + (Math.abs(hash) % 15); // 45-60% lightness
  
  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness1}%)`;
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness2}%)`;
  
  // Apply gradient to body
  document.body.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  
  console.log(`🎨 Daily background set: ${color1} → ${color2}`);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing newtab-v2.js');
  
  // Set daily random background
  setDailyBackground();
  
  // Check if required elements exist
  const requiredElements = {
    jokeEl,
    nextJokeBtn,
    copyBtn,
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
    nextJokeBtn.addEventListener('click', async () => {
      // Check if we need to refresh jokes before showing next
      await checkAndRefreshJokes();
      await showRandomJoke();
    });
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
  // Migration will happen after jokes are loaded
  console.log('Starting to load jokes...');
  loadJokes();
});

// Save user ID
localStorage.setItem('userId', userId);
