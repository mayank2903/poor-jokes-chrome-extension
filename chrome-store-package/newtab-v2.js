// Poor Jokes New Tab Extension - Enhanced with APIManager
// This version uses the new API management system

// DOM Elements
const jokeEl = document.getElementById('joke');
const nextJokeBtn = document.getElementById('next-joke');
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

// Event Listeners
nextJokeBtn.addEventListener('click', showRandomJoke);
thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
thumbsDownBtn.addEventListener('click', () => rateJoke('down'));
submitJokeBtn.addEventListener('click', showSubmissionForm);
cancelSubmission.addEventListener('click', hideSubmissionForm);
submitJoke.addEventListener('click', submitJokeToAPI);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
