/**
 * @fileoverview Main application class for the Poor Jokes extension
 */

const configManager = require('../shared/config');
const jokeService = require('./services/joke-service');
const JokeCard = require('./components/joke-card');
const { APP_CONSTANTS, CSS_CLASSES } = require('../shared/constants');

/**
 * Main application class
 */
class PoorJokesApp {
  constructor() {
    this.config = configManager;
    this.jokeService = jokeService;
    this.currentJoke = null;
    this.jokeCard = null;
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = this.config.get('api.retryAttempts');
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize configuration
      await this.config.initialize();
      
      // Set up UI
      this.setupUI();
      
      // Load initial joke
      await this.loadJoke();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('🎭 Poor Jokes app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Set up the UI elements
   */
  setupUI() {
    // Create main container if it doesn't exist
    let container = document.querySelector(`.${CSS_CLASSES.CONTAINER}`);
    if (!container) {
      container = document.createElement('div');
      container.className = CSS_CLASSES.CONTAINER;
      document.body.appendChild(container);
    }

    // Create header
    this.createHeader(container);
    
    // Create joke display area
    this.createJokeArea(container);
    
    // Create controls
    this.createControls(container);
    
    // Create submission form
    this.createSubmissionForm(container);
    
    // Create footer
    this.createFooter(container);
  }

  /**
   * Create header section
   * @param {HTMLElement} container - Container element
   */
  createHeader(container) {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <h1 class="app-title">${this.config.get('app.name')}</h1>
      <p class="app-subtitle">Bringing laughter to every new tab</p>
    `;
    container.appendChild(header);
  }

  /**
   * Create joke display area
   * @param {HTMLElement} container - Container element
   */
  createJokeArea(container) {
    const jokeArea = document.createElement('div');
    jokeArea.className = 'joke-area';
    jokeArea.innerHTML = `
      <div class="joke-container">
        <div class="loading-spinner hidden">Loading...</div>
        <div class="error-message hidden">Failed to load joke</div>
        <div class="joke-card-container"></div>
      </div>
    `;
    container.appendChild(jokeArea);
  }

  /**
   * Create controls section
   * @param {HTMLElement} container - Container element
   */
  createControls(container) {
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
      <div class="control-buttons">
        <button class="${CSS_CLASSES.BUTTON} ${CSS_CLASSES.BUTTON_PRIMARY} new-joke-btn">
          🎲 New Joke
        </button>
        <button class="${CSS_CLASSES.BUTTON} ${CSS_CLASSES.BUTTON_SECONDARY} submit-joke-btn">
          📝 Submit Joke
        </button>
        <button class="${CSS_CLASSES.BUTTON} ${CSS_CLASSES.BUTTON_SECONDARY} admin-btn">
          ⚙️ Admin
        </button>
      </div>
    `;
    container.appendChild(controls);
  }

  /**
   * Create submission form
   * @param {HTMLElement} container - Container element
   */
  createSubmissionForm(container) {
    const formContainer = document.createElement('div');
    formContainer.className = 'submission-form-container hidden';
    formContainer.innerHTML = `
      <div class="submission-form">
        <h3>Submit a Joke</h3>
        <form class="${CSS_CLASSES.FORM}" id="joke-submission-form">
          <div class="${CSS_CLASSES.FORM_GROUP}">
            <label for="joke-content">Your Joke:</label>
            <textarea 
              id="joke-content" 
              class="${CSS_CLASSES.FORM_TEXTAREA}" 
              placeholder="Enter your poor joke here..."
              maxlength="${this.config.get('ui.maxJokeLength')}"
              required
            ></textarea>
            <div class="character-count">
              <span class="current-count">0</span> / ${this.config.get('ui.maxJokeLength')}
            </div>
          </div>
          <div class="${CSS_CLASSES.FORM_GROUP}">
            <label for="submitter-name">Your Name (optional):</label>
            <input 
              type="text" 
              id="submitter-name" 
              class="${CSS_CLASSES.FORM_INPUT}" 
              placeholder="Anonymous"
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="${CSS_CLASSES.FORM_BUTTON} ${CSS_CLASSES.BUTTON_PRIMARY}">
              Submit Joke
            </button>
            <button type="button" class="${CSS_CLASSES.FORM_BUTTON} ${CSS_CLASSES.BUTTON_SECONDARY} cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;
    container.appendChild(formContainer);
  }

  /**
   * Create footer section
   * @param {HTMLElement} container - Container element
   */
  createFooter(container) {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.innerHTML = `
      <div class="footer-content">
        <p>&copy; 2024 ${this.config.get('app.author')}. Made with 😂 and poor jokes.</p>
        <div class="footer-links">
          <a href="#" class="privacy-link">Privacy Policy</a>
          <a href="#" class="admin-link">Admin Dashboard</a>
        </div>
      </div>
    `;
    container.appendChild(footer);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // New joke button
    const newJokeBtn = document.querySelector('.new-joke-btn');
    if (newJokeBtn) {
      newJokeBtn.addEventListener('click', () => this.loadJoke());
    }

    // Submit joke button
    const submitJokeBtn = document.querySelector('.submit-joke-btn');
    if (submitJokeBtn) {
      submitJokeBtn.addEventListener('click', () => this.toggleSubmissionForm());
    }

    // Admin button
    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => this.openAdminDashboard());
    }

    // Cancel button
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.toggleSubmissionForm(false));
    }

    // Submission form
    const form = document.getElementById('joke-submission-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleJokeSubmission(e));
    }

    // Character count
    const textarea = document.getElementById('joke-content');
    if (textarea) {
      textarea.addEventListener('input', () => this.updateCharacterCount());
    }
  }

  /**
   * Load a new joke
   * @returns {Promise<void>}
   */
  async loadJoke() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const joke = await this.jokeService.getRandomJoke();
      this.currentJoke = joke;
      this.displayJoke(joke);
      this.retryCount = 0;
    } catch (error) {
      console.error('Error loading joke:', error);
      this.handleLoadError(error);
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  /**
   * Display a joke
   * @param {Object} joke - Joke object
   */
  displayJoke(joke) {
    const container = document.querySelector('.joke-card-container');
    if (!container) return;

    // Remove existing joke card
    if (this.jokeCard) {
      this.jokeCard.destroy();
    }

    // Create new joke card
    this.jokeCard = new JokeCard(joke, {
      onRating: (joke, rating) => this.handleJokeRating(joke, rating),
      onCopy: (joke) => this.handleJokeCopy(joke)
    });

    const cardElement = this.jokeCard.create();
    container.innerHTML = '';
    container.appendChild(cardElement);
  }

  /**
   * Handle joke rating
   * @param {Object} joke - Joke object
   * @param {string} rating - Rating type
   */
  handleJokeRating(joke, rating) {
    console.log(`Joke ${joke.id} rated as ${rating}`);
    // Additional rating handling can be added here
  }

  /**
   * Handle joke copy
   * @param {Object} joke - Joke object
   */
  handleJokeCopy(joke) {
    console.log(`Joke ${joke.id} copied to clipboard`);
    // Additional copy handling can be added here
  }

  /**
   * Toggle submission form visibility
   * @param {boolean} show - Whether to show the form
   */
  toggleSubmissionForm(show = null) {
    const formContainer = document.querySelector('.submission-form-container');
    if (!formContainer) return;

    const isHidden = formContainer.classList.contains('hidden');
    const shouldShow = show !== null ? show : isHidden;

    if (shouldShow) {
      formContainer.classList.remove('hidden');
      document.getElementById('joke-content')?.focus();
    } else {
      formContainer.classList.add('hidden');
      this.resetSubmissionForm();
    }
  }

  /**
   * Handle joke submission
   * @param {Event} event - Form submit event
   */
  async handleJokeSubmission(event) {
    event.preventDefault();

    const content = document.getElementById('joke-content')?.value?.trim();
    const submittedBy = document.getElementById('submitter-name')?.value?.trim() || 'Anonymous';

    if (!content) {
      this.showError('Please enter a joke');
      return;
    }

    try {
      await this.jokeService.submitJoke(content, submittedBy);
      this.showSuccess(APP_CONSTANTS.SUCCESS_MESSAGES.JOKE_SUBMITTED);
      this.toggleSubmissionForm(false);
    } catch (error) {
      console.error('Error submitting joke:', error);
      this.showError(error.message || 'Failed to submit joke');
    }
  }

  /**
   * Reset submission form
   */
  resetSubmissionForm() {
    const form = document.getElementById('joke-submission-form');
    if (form) {
      form.reset();
      this.updateCharacterCount();
    }
  }

  /**
   * Update character count
   */
  updateCharacterCount() {
    const textarea = document.getElementById('joke-content');
    const counter = document.querySelector('.current-count');
    
    if (textarea && counter) {
      const count = textarea.value.length;
      counter.textContent = count;
      
      if (count > this.config.get('ui.maxJokeLength') * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }
    }
  }

  /**
   * Open admin dashboard
   */
  openAdminDashboard() {
    const adminUrl = this.config.get('api.baseUrl').replace('/api', '/admin');
    window.open(adminUrl, '_blank');
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    const errorMsg = document.querySelector('.error-message');
    
    if (spinner) spinner.classList.remove('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) spinner.classList.add('hidden');
  }

  /**
   * Handle load error
   * @param {Error} error - Error object
   */
  handleLoadError(error) {
    const errorMsg = document.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.textContent = error.message || 'Failed to load joke';
      errorMsg.classList.remove('hidden');
    }

    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.loadJoke(), 2000 * this.retryCount);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show message
   * @param {string} message - Message text
   * @param {string} type - Message type
   */
  showMessage(message, type) {
    // Create or update message element
    let messageEl = document.querySelector('.app-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'app-message';
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `app-message message-${type}`;
    messageEl.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new PoorJokesApp();
    app.initialize();
  });
} else {
  const app = new PoorJokesApp();
  app.initialize();
}

module.exports = PoorJokesApp;
