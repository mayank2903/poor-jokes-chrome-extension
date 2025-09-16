/**
 * @fileoverview Joke content formatting and validation utilities
 */

/**
 * Format and clean joke content before database storage
 * @param {string} content - Raw joke content
 * @returns {Object} Formatted content and validation result
 */
function formatJokeContent(content) {
  if (!content || typeof content !== 'string') {
    return {
      formatted: '',
      isValid: false,
      errors: ['Content must be a non-empty string']
    };
  }

  const errors = [];
  let formatted = content;

  // Step 1: Basic trimming and whitespace normalization
  formatted = formatted.trim();

  // Step 2: Check if content is empty after trimming
  if (formatted.length === 0) {
    return {
      formatted: '',
      isValid: false,
      errors: ['Content cannot be empty or only whitespace']
    };
  }

  // Step 3: Normalize whitespace (multiple spaces to single space)
  formatted = formatted.replace(/\s+/g, ' ');

  // Step 4: Remove excessive punctuation
  // Remove multiple consecutive punctuation marks
  formatted = formatted.replace(/[!?]{2,}/g, (match) => match[0]);
  formatted = formatted.replace(/[.]{3,}/g, '...');

  // Step 5: Capitalize first letter
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  // Step 6: Ensure proper sentence ending
  if (!/[.!?]$/.test(formatted)) {
    formatted += '.';
  }

  // Step 7: Validate length
  if (formatted.length > 500) {
    errors.push('Content is too long (max 500 characters)');
  }

  if (formatted.length < 10) {
    errors.push('Content is too short (min 10 characters)');
  }

  // Step 8: Check for invalid content patterns
  const invalidPatterns = [
    /^[^a-zA-Z0-9]*$/, // Only special characters
    /^(.)\1{10,}$/, // Repeated single character
    /^[a-z\s]*$/, // All lowercase (might be gibberish)
    /^[A-Z\s]*$/, // All uppercase (might be shouting)
    /^\d+$/, // Only numbers
    /^[^\w\s]*$/, // No alphanumeric characters
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(formatted)) {
      errors.push('Content appears to be invalid or nonsensical');
      break;
    }
  }

  // Step 9: Check for common gibberish patterns
  const gibberishPatterns = [
    /^[a-z]{1,3}\s[a-z]{1,3}$/, // Very short words (like "bilom waenx")
    /^[a-z]{2,}\s[a-z]{2,}\s[a-z]{2,}$/, // Three short words that might be gibberish
  ];

  for (const pattern of gibberishPatterns) {
    if (pattern.test(formatted.toLowerCase())) {
      // Check if it contains common English words
      const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'];
      const words = formatted.toLowerCase().split(/\s+/);
      const hasCommonWords = words.some(word => commonWords.includes(word));
      
      if (!hasCommonWords) {
        errors.push('Content appears to be gibberish or nonsensical');
        break;
      }
    }
  }

  // Step 10: Check for minimum word count
  const wordCount = formatted.split(/\s+/).length;
  if (wordCount < 3) {
    errors.push('Content must contain at least 3 words');
  }

  return {
    formatted,
    isValid: errors.length === 0,
    errors,
    originalLength: content.length,
    formattedLength: formatted.length,
    wordCount
  };
}

/**
 * Format submitter name
 * @param {string} submittedBy - Raw submitter name
 * @returns {string} Formatted submitter name
 */
function formatSubmitterName(submittedBy) {
  if (!submittedBy || typeof submittedBy !== 'string') {
    return 'Anonymous';
  }

  let formatted = submittedBy.trim();

  // Remove excessive whitespace
  formatted = formatted.replace(/\s+/g, ' ');

  // Capitalize first letter of each word
  formatted = formatted.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');

  // Limit length
  if (formatted.length > 50) {
    formatted = formatted.substring(0, 50).trim();
  }

  // If empty after formatting, return Anonymous
  if (formatted.length === 0) {
    return 'Anonymous';
  }

  return formatted;
}

/**
 * Validate joke content for quality
 * @param {string} content - Joke content
 * @returns {Object} Validation result
 */
function validateJokeQuality(content) {
  const qualityChecks = {
    hasQuestion: /[?]/.test(content),
    hasPunctuation: /[.!?]/.test(content),
    hasCommonWords: /\b(the|and|or|but|in|on|at|to|for|of|with|by|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall)\b/i.test(content),
    reasonableLength: content.length >= 20 && content.length <= 400,
    hasVariety: new Set(content.toLowerCase().split('')).size > 10,
    notRepetitive: !/(.)\1{3,}/.test(content)
  };

  const qualityScore = Object.values(qualityChecks).filter(Boolean).length;
  const maxScore = Object.keys(qualityChecks).length;

  return {
    ...qualityChecks,
    score: qualityScore,
    maxScore,
    percentage: Math.round((qualityScore / maxScore) * 100),
    isHighQuality: qualityScore >= 4
  };
}

module.exports = {
  formatJokeContent,
  formatSubmitterName,
  validateJokeQuality
};
