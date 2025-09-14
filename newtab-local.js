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

// API Configuration - LOCAL DEVELOPMENT
const API_BASE_URL = 'http://localhost:3001/api';

// Global state
let currentJoke = null;
let allJokes = [];
let userRatings = JSON.parse(localStorage.getItem('userRatings') || '{}');

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
  
  const randomIndex = Math.floor(Math.random() * allJokes.length);
  currentJoke = allJokes[randomIndex];
  jokeEl.textContent = currentJoke.content;
  updateRatingDisplay();
}

function showJoke(joke) {
  currentJoke = joke;
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
      
      // Reload jokes to get updated ratings
      await loadJokes();
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
