// Select DOM elements
const jokeEl = document.getElementById('joke');
const anotherBtn = document.getElementById('another');
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

// API Configuration - Now managed by APIManager
// const API_BASE_URL = 'https://poor-jokes-newtab-ohv70wfm5-mayanks-projects-72f678fa.vercel.app/api';

// Global state
let currentJoke = null;
let allJokes = [];
let userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');

// Repeat prevention system
let displayHistory = JSON.parse(localStorage.getItem('poorJokes_displayHistory') || '[]');
let lastJokeId = null;

// Generate a simple user ID for this browser
const userId = localStorage.getItem('userId') || generateUserId();
if (!localStorage.getItem('userId')) {
  localStorage.setItem('userId', userId);
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Load jokes from API
async function loadJokes() {
  try {
    const response = await fetch(`${API_BASE_URL}/jokes`);
    const data = await response.json();
    
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

function showRandomJoke() {
  if (allJokes.length === 0) return;
  
  // Get available jokes (not shown recently)
  const availableJokes = getAvailableJokes();
  
  if (availableJokes.length === 0) {
    // All jokes have been shown recently, reset history and start fresh
    console.log('🔄 All jokes shown recently, resetting display history');
    displayHistory = [];
    localStorage.setItem('poorJokes_displayHistory', JSON.stringify(displayHistory));
    
    // Try again with all jokes available
    const allAvailableJokes = allJokes.filter(joke => joke.id !== lastJokeId);
    if (allAvailableJokes.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAvailableJokes.length);
      showJoke(allAvailableJokes[randomIndex]);
    } else {
      // Only one joke available, show it
      showJoke(allJokes[0]);
    }
    return;
  }
  
  // Select random joke from available ones
  const randomIndex = Math.floor(Math.random() * availableJokes.length);
  showJoke(availableJokes[randomIndex]);
}

// Get jokes that haven't been shown recently
function getAvailableJokes() {
  // Filter out jokes that have been shown in the last 10 displays
  const recentJokeIds = displayHistory.slice(-10);
  return allJokes.filter(joke => !recentJokeIds.includes(joke.id));
}

function showJoke(joke) {
  currentJoke = joke;
  
  // Track this joke in display history
  if (joke && joke.id) {
    // Remove any existing entry for this joke to avoid duplicates
    displayHistory = displayHistory.filter(id => id !== joke.id);
    
    // Add to end of history
    displayHistory.push(joke.id);
    
    // Keep only last 20 entries to prevent localStorage from growing too large
    if (displayHistory.length > 20) {
      displayHistory = displayHistory.slice(-20);
    }
    
    // Save to localStorage
    localStorage.setItem('poorJokes_displayHistory', JSON.stringify(displayHistory));
    
    // Update last joke ID
    lastJokeId = joke.id;
    
    console.log('📝 Added joke to display history:', joke.id);
    console.log('📊 Display history length:', displayHistory.length);
  }
  
  jokeEl.textContent = joke.content;
  updateRatingDisplay();
}

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
    const response = await fetch(`${API_BASE_URL}/jokes`);
    const data = await response.json();
    
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

async function rateJoke(rating) {
  if (!currentJoke) return;
  
  const ratingValue = rating === 'up' ? 1 : -1;
  const previousRating = userRatings[currentJoke.id];
  
  try {
    const response = await fetch(`${API_BASE_URL}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        joke_id: currentJoke.id,
        user_id: userId,
        rating: ratingValue
      })
    });
    
    const data = await response.json();
    
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

// Joke submission functions
function showSubmissionForm() {
  submissionForm.style.display = 'block';
  submitJokeBtn.style.display = 'none';
  jokeTextarea.focus();
}

function hideSubmissionForm() {
  submissionForm.style.display = 'none';
  submitJokeBtn.style.display = 'block';
  jokeTextarea.value = '';
  submissionStatus.textContent = '';
}

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
    const response = await fetch(`${API_BASE_URL}/jokes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        submitted_by: userId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      submissionStatus.textContent = 'Joke submitted successfully! It will be reviewed before being added.';
      submissionStatus.className = 'submission-status success';
      jokeTextarea.value = '';
      setTimeout(hideSubmissionForm, 3000);
    } else {
      submissionStatus.textContent = `Error: ${data.error}`;
      submissionStatus.className = 'submission-status error';
    }
  } catch (error) {
    console.error('Error submitting joke:', error);
    submissionStatus.textContent = 'Failed to submit joke. Please try again.';
    submissionStatus.className = 'submission-status error';
  } finally {
    submitJoke.disabled = false;
  }
}

// Initialize the app
loadJokes();

// Event listeners
anotherBtn.addEventListener('click', () => showRandomJoke());
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

// Rating button event listeners
thumbsUpBtn.addEventListener('click', () => rateJoke('up'));
thumbsDownBtn.addEventListener('click', () => rateJoke('down'));

// Submission form event listeners
submitJokeBtn.addEventListener('click', showSubmissionForm);
cancelSubmission.addEventListener('click', hideSubmissionForm);
submitJoke.addEventListener('click', submitJokeToAPI);

// Handle Enter key in textarea
jokeTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    submitJokeToAPI();
  }
});

// Optional: rotate joke automatically every X seconds (commented out)
// setInterval(() => showJoke(randomJoke()), 15000);