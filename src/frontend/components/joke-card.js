/**
 * @fileoverview Joke card component with modern UI patterns
 */

const { APP_CONSTANTS, CSS_CLASSES } = require('../../shared/constants');
const jokeService = require('../services/joke-service');

/**
 * Joke card component class
 */
class JokeCard {
  constructor(joke, options = {}) {
    this.joke = joke;
    this.options = {
      showRating: true,
      showCopyButton: true,
      showShareButton: false,
      onRating: null,
      onCopy: null,
      ...options
    };
    this.element = null;
    this.isRated = jokeService.isJokeRated(joke.id);
    this.ratingCooldown = false;
  }

  /**
   * Create the joke card element
   * @returns {HTMLElement} Joke card element
   */
  create() {
    const card = document.createElement('div');
    card.className = `${CSS_CLASSES.CARD} ${CSS_CLASSES.JOKE_CARD}`;
    card.dataset.jokeId = this.joke.id;

    card.innerHTML = this.getTemplate();
    this.element = card;

    this.attachEventListeners();
    return card;
  }

  /**
   * Get HTML template for joke card
   * @returns {string} HTML template
   */
  getTemplate() {
    const ratingButtons = this.options.showRating ? this.getRatingButtons() : '';
    const copyButton = this.options.showCopyButton ? this.getCopyButton() : '';
    const shareButton = this.options.showShareButton ? this.getShareButton() : '';

    return `
      <div class="joke-content">
        <p class="joke-text">${this.escapeHtml(this.joke.content)}</p>
      </div>
      
      <div class="joke-meta">
        <div class="joke-stats">
          <span class="rating-display">
            <span class="up-votes">👍 ${this.joke.up_votes || 0}</span>
            <span class="down-votes">👎 ${this.joke.down_votes || 0}</span>
            <span class="rating-percentage">${this.joke.rating_percentage || 0}%</span>
          </span>
        </div>
        
        <div class="joke-actions">
          ${ratingButtons}
          ${copyButton}
          ${shareButton}
        </div>
      </div>
      
      <div class="joke-footer">
        <small class="joke-date">${this.formatDate(this.joke.created_at)}</small>
      </div>
    `;
  }

  /**
   * Get rating buttons HTML
   * @returns {string} Rating buttons HTML
   */
  getRatingButtons() {
    if (this.isRated) {
      return '<div class="rating-feedback">Thanks for rating!</div>';
    }

    return `
      <div class="${CSS_CLASSES.RATING_CONTAINER}">
        <button 
          class="${CSS_CLASSES.RATING_BUTTON} ${CSS_CLASSES.RATING_UP}" 
          data-rating="up"
          title="Rate up"
        >
          👍
        </button>
        <button 
          class="${CSS_CLASSES.RATING_BUTTON} ${CSS_CLASSES.RATING_DOWN}" 
          data-rating="down"
          title="Rate down"
        >
          👎
        </button>
      </div>
    `;
  }

  /**
   * Get copy button HTML
   * @returns {string} Copy button HTML
   */
  getCopyButton() {
    return `
      <button 
        class="${CSS_CLASSES.BUTTON} ${CSS_CLASSES.BUTTON_SECONDARY} copy-btn" 
        title="Copy joke"
      >
        📋 Copy
      </button>
    `;
  }

  /**
   * Get share button HTML
   * @returns {string} Share button HTML
   */
  getShareButton() {
    return `
      <button 
        class="${CSS_CLASSES.BUTTON} ${CSS_CLASSES.BUTTON_SECONDARY} share-btn" 
        title="Share joke"
      >
        🔗 Share
      </button>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.element) return;

    // Rating buttons
    if (this.options.showRating && !this.isRated) {
      const ratingButtons = this.element.querySelectorAll(`.${CSS_CLASSES.RATING_BUTTON}`);
      ratingButtons.forEach(button => {
        button.addEventListener('click', (e) => this.handleRating(e));
      });
    }

    // Copy button
    if (this.options.showCopyButton) {
      const copyButton = this.element.querySelector('.copy-btn');
      if (copyButton) {
        copyButton.addEventListener('click', (e) => this.handleCopy(e));
      }
    }

    // Share button
    if (this.options.showShareButton) {
      const shareButton = this.element.querySelector('.share-btn');
      if (shareButton) {
        shareButton.addEventListener('click', (e) => this.handleShare(e));
      }
    }
  }

  /**
   * Handle rating button click
   * @param {Event} event - Click event
   */
  async handleRating(event) {
    if (this.ratingCooldown || this.isRated) return;

    const rating = event.target.dataset.rating;
    if (!rating) return;

    this.ratingCooldown = true;
    this.showLoadingState();

    try {
      await jokeService.rateJoke(this.joke.id, rating);
      
      this.isRated = true;
      this.updateRatingDisplay();
      this.showSuccessMessage('Thanks for rating!');
      
      if (this.options.onRating) {
        this.options.onRating(this.joke, rating);
      }
    } catch (error) {
      this.showErrorMessage('Failed to rate joke. Please try again.');
      console.error('Rating error:', error);
    } finally {
      this.ratingCooldown = false;
      this.hideLoadingState();
    }
  }

  /**
   * Handle copy button click
   * @param {Event} event - Click event
   */
  async handleCopy(event) {
    try {
      await navigator.clipboard.writeText(this.joke.content);
      this.showSuccessMessage('Joke copied to clipboard!');
      
      if (this.options.onCopy) {
        this.options.onCopy(this.joke);
      }
    } catch (error) {
      // Fallback for older browsers
      this.fallbackCopy();
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  fallbackCopy() {
    const textArea = document.createElement('textarea');
    textArea.value = this.joke.content;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showSuccessMessage('Joke copied to clipboard!');
    } catch (error) {
      this.showErrorMessage('Failed to copy joke');
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Handle share button click
   * @param {Event} event - Click event
   */
  handleShare(event) {
    if (navigator.share) {
      navigator.share({
        title: 'Poor Joke',
        text: this.joke.content,
        url: window.location.href
      });
    } else {
      // Fallback to copy
      this.handleCopy(event);
    }
  }

  /**
   * Update rating display
   */
  updateRatingDisplay() {
    const ratingContainer = this.element.querySelector(`.${CSS_CLASSES.RATING_CONTAINER}`);
    if (ratingContainer) {
      ratingContainer.innerHTML = '<div class="rating-feedback">Thanks for rating!</div>';
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const ratingButtons = this.element.querySelectorAll(`.${CSS_CLASSES.RATING_BUTTON}`);
    ratingButtons.forEach(button => {
      button.disabled = true;
      button.classList.add(CSS_CLASSES.LOADING);
    });
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const ratingButtons = this.element.querySelectorAll(`.${CSS_CLASSES.RATING_BUTTON}`);
    ratingButtons.forEach(button => {
      button.disabled = false;
      button.classList.remove(CSS_CLASSES.LOADING);
    });
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message
   * @param {string} message - Message text
   * @param {string} type - Message type
   */
  showMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    this.element.appendChild(messageEl);
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Update joke data
   * @param {Object} newJoke - Updated joke data
   */
  update(newJoke) {
    this.joke = { ...this.joke, ...newJoke };
    if (this.element) {
      this.element.innerHTML = this.getTemplate();
      this.attachEventListeners();
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

module.exports = JokeCard;
