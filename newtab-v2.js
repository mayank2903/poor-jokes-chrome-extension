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

// Generate unique user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Load jokes from API using APIManager
async function loadJokes() {
  try {
    const data = await window.APIManager.request('/jokes');
    
    if (data.success) {
      allJokes = data.jokes;
      showRandomJoke();
    } else {
      throw new Error('Failed to load jokes');
    }
  } catch (error) {
    console.error('Error loading jokes:', error);
    // Fallback to local jokes
    allJokes = POOR_JOKES.map((content, index) => ({
      id: `local_${index}`,
      content: content,
      up_votes: 0,
      down_votes: 0,
      total_votes: 0,
      rating_percentage: 0
    }));
    showRandomJoke();
  }
}

// Show random joke
function showRandomJoke() {
  if (allJokes.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * allJokes.length);
  showJoke(allJokes[randomIndex]);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners after DOM is loaded
  if (nextJokeBtn) nextJokeBtn.addEventListener('click', showRandomJoke);
  if (copyBtn) copyBtn.addEventListener('click', async () => {
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
  if (thumbsUpBtn) thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
  if (thumbsDownBtn) thumbsDownBtn.addEventListener('click', () => rateJoke('down'));
  if (submitJokeBtn) submitJokeBtn.addEventListener('click', showSubmissionForm);
  if (cancelSubmission) cancelSubmission.addEventListener('click', hideSubmissionForm);
  if (submitJoke) submitJoke.addEventListener('click', submitJokeToAPI);
  
  // Wait for APIManager to be ready
  if (window.APIManager) {
    loadJokes();
  } else {
    // Fallback if APIManager isn't loaded yet
    setTimeout(loadJokes, 1000);
  }
});

// Save user ID
localStorage.setItem('userId', userId);
