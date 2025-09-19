/**
 * @fileoverview AI-powered joke generator with quality filtering
 */

// Dynamic import for node-fetch (ES module)
let fetch;

class JokeGenerator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.qualityThreshold = 0.7; // Minimum quality score for jokes
    this.supabase = null;
    this.fetchInitialized = false;
    this.initializeSupabase();
  }

  /**
   * Initialize fetch dynamically (ES module)
   */
  async initializeFetch() {
    if (!this.fetchInitialized) {
      try {
        const fetchModule = await import('node-fetch');
        fetch = fetchModule.default;
        this.fetchInitialized = true;
      } catch (error) {
        console.error('Error initializing fetch:', error);
        // Fallback to global fetch if available
        if (typeof globalThis.fetch !== 'undefined') {
          fetch = globalThis.fetch;
          this.fetchInitialized = true;
        }
      }
    }
  }

  /**
   * Initialize Supabase client for duplicate checking
   */
  initializeSupabase() {
    try {
      const { createClient } = require('@supabase/supabase-js');
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error('Error initializing Supabase:', error);
    }
  }

  /**
   * Generate 5 high-quality poor jokes using OpenAI
   * @returns {Promise<Array>} Array of generated jokes with quality scores
   */
  async generateJokes() {
    // Initialize fetch first
    await this.initializeFetch();
    
    if (!this.openaiApiKey) {
      console.log('OpenAI API key not configured, using fallback jokes');
      return this.getFallbackJokes();
    }

    try {
      const prompt = `Generate 5 high-quality PUNS that are:
1. Clean and family-friendly
2. Clever wordplay and double meanings
3. Short and punchy (1-2 sentences max)
4. Creative and original puns
5. Actually funny (not just bad wordplay)
6. Focus on clever language tricks and homophones

Format as JSON array with this structure:
[
  {
    "content": "pun text here",
    "category": "pun|wordplay|dad joke",
    "quality_score": 0.8
  }
]

Make sure each pun has a quality_score between 0.0 and 1.0, and only include puns with score >= 0.7. Examples of good puns:
- "I'm reading a book about anti-gravity. It's impossible to put down!"
- "Why don't scientists trust atoms? Because they make up everything!"
- "I told my wife she was drawing her eyebrows too high. She looked surprised."`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional comedy writer specializing in clever puns and wordplay. You excel at creating clean, family-friendly puns that are genuinely funny and clever.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response
      const jokes = JSON.parse(content);
      
      // Filter by quality score
      const highQualityJokes = jokes.filter(joke => 
        joke.quality_score >= this.qualityThreshold
      );

      console.log(`Generated ${highQualityJokes.length} high-quality puns`);
      return highQualityJokes;

    } catch (error) {
      console.error('Error generating jokes with OpenAI:', error);
      return this.getFallbackJokes();
    }
  }

  /**
   * Fallback puns when OpenAI is not available
   * @returns {Array} Array of curated fallback puns
   */
  getFallbackJokes() {
    // Curated collection of high-quality puns
    const puns = [
      "I'm reading a book about anti-gravity. It's impossible to put down!",
      "Why don't scientists trust atoms? Because they make up everything!",
      "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "I used to be a baker, but I couldn't make enough dough.",
      "Why don't eggs tell jokes? They'd crack each other up!",
      "What do you call a fake noodle? An impasta!",
      "Why did the math book look so sad? Because it had too many problems.",
      "What do you call a bear with no teeth? A gummy bear!",
      "Why don't skeletons fight each other? They don't have the guts.",
      "What do you call a fish wearing a bowtie? So-fish-ticated!",
      "Why did the coffee file a police report? It got mugged.",
      "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
      "Why don't oysters donate to charity? Because they are shellfish.",
      "What do you call a group of disorganized cats? A cat-astrophe!",
      "Why did the bicycle fall over? It was two tired.",
      "What do you call a can opener that doesn't work? A can't opener!",
      "Why don't scientists trust stairs? Because they're always up to something.",
      "What do you call a bear that's stuck in the rain? A drizzly bear!",
      "Why did the tomato turn red? Because it saw the salad dressing!",
      "What do you call a fish that wears a crown? A king fish!",
      "Why don't eggs tell each other secrets? Because they might crack up!",
      "What do you call a sleeping bull? A bulldozer!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "What do you call a bear with no teeth? A gummy bear!",
      "Why don't scientists trust atoms? Because they make up everything!",
      "What do you call a fake noodle? An impasta!",
      "Why did the math book look so sad? Because it had too many problems.",
      "What do you call a fish wearing a bowtie? So-fish-ticated!",
      "Why did the coffee file a police report? It got mugged."
    ];
    
    // Shuffle and return 5 random puns
    const shuffledPuns = this.shuffleArray(puns);
    return shuffledPuns.slice(0, 5).map(pun => ({
      content: pun,
      category: "pun",
      quality_score: 0.8 + Math.random() * 0.2 // Random quality between 0.8-1.0
    }));
  }

  /**
   * Shuffle array to get random jokes
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if a joke already exists in the database
   * @param {string} content - Joke content to check
   * @returns {Promise<boolean>} Whether the joke is a duplicate
   */
  async isDuplicate(content) {
    if (!this.supabase) {
      console.log('Supabase not initialized, skipping duplicate check');
      return false;
    }

    try {
      // Normalize the content for comparison (lowercase, trim, remove extra spaces)
      const normalizedContent = content.toLowerCase().trim().replace(/\s+/g, ' ');
      
      // Check in both jokes and joke_submissions tables with exact match first
      const { data: existingJokes, error: jokesError } = await this.supabase
        .from('jokes')
        .select('content')
        .ilike('content', normalizedContent);

      const { data: existingSubmissions, error: submissionsError } = await this.supabase
        .from('joke_submissions')
        .select('content')
        .ilike('content', normalizedContent);

      if (jokesError || submissionsError) {
        console.error('Error checking for duplicates:', jokesError || submissionsError);
        return false; // If we can't check, assume it's not a duplicate
      }

      // Check for exact matches first (most reliable)
      const allExistingContent = [
        ...(existingJokes || []),
        ...(existingSubmissions || [])
      ].map(item => item.content.toLowerCase().trim().replace(/\s+/g, ' '));

      const exactMatch = allExistingContent.some(existing => existing === normalizedContent);
      
      if (exactMatch) {
        console.log(`🚫 Exact duplicate found: "${content.substring(0, 50)}..."`);
        return true;
      }

      // Also check for very similar content (95% similarity for stricter matching)
      const similarMatch = allExistingContent.some(existing => {
        const similarity = this.calculateSimilarity(existing, normalizedContent);
        return similarity > 0.95;
      });

      if (similarMatch) {
        console.log(`🚫 Similar duplicate found: "${content.substring(0, 50)}..."`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // If we can't check, assume it's not a duplicate
    }
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score between 0 and 1
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Validate joke quality and content
   * @param {Object} joke - Joke object to validate
   * @returns {boolean} Whether the joke passes validation
   */
  validateJoke(joke) {
    // Check required fields
    if (!joke.content || !joke.category || typeof joke.quality_score !== 'number') {
      return false;
    }

    // Check quality score
    if (joke.quality_score < this.qualityThreshold) {
      return false;
    }

    // Check content length (not too short, not too long)
    if (joke.content.length < 10 || joke.content.length > 200) {
      return false;
    }

    // Check for inappropriate content (basic filtering)
    const inappropriateWords = ['hate', 'stupid', 'dumb', 'ugly', 'fat'];
    const hasInappropriateContent = inappropriateWords.some(word => 
      joke.content.toLowerCase().includes(word)
    );

    if (hasInappropriateContent) {
      return false;
    }

    return true;
  }

  /**
   * Generate and validate jokes for daily submission with duplicate checking
   * @returns {Promise<Array>} Array of validated, unique jokes ready for submission
   */
  async generateDailyJokes() {
    console.log('🎭 Generating daily puns...');
    
    const generatedJokes = await this.generateJokes();
    const validatedJokes = generatedJokes.filter(joke => this.validateJoke(joke));
    
    console.log(`✅ Generated ${validatedJokes.length} validated puns`);
    
    // Check for duplicates and filter them out
    const uniqueJokes = [];
    let duplicatesFound = 0;
    
    for (const joke of validatedJokes) {
      const isDuplicate = await this.isDuplicate(joke.content);
      
      if (isDuplicate) {
        duplicatesFound++;
        console.log(`🚫 Skipping duplicate: "${joke.content.substring(0, 50)}..."`);
      } else {
        uniqueJokes.push(joke);
      }
    }
    
    console.log(`🔍 Found ${duplicatesFound} duplicates, ${uniqueJokes.length} unique puns remaining`);
    
    // Keep generating until we have 5 unique jokes
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    while (uniqueJokes.length < 5 && attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}: Need ${5 - uniqueJokes.length} more unique puns...`);
      
      const additionalJokes = await this.generateAdditionalJokes(5 - uniqueJokes.length + 2); // Generate extra to account for duplicates
      const additionalValidated = additionalJokes.filter(joke => this.validateJoke(joke));
      
      for (const joke of additionalValidated) {
        if (uniqueJokes.length >= 5) break;
        
        const isDuplicate = await this.isDuplicate(joke.content);
        if (!isDuplicate) {
          uniqueJokes.push(joke);
          console.log(`✅ Added unique pun: "${joke.content.substring(0, 50)}..."`);
        } else {
          console.log(`🚫 Skipping duplicate: "${joke.content.substring(0, 50)}..."`);
        }
      }
    }
    
    console.log(`🎉 Final result: ${uniqueJokes.length} unique puns ready for submission`);
    return uniqueJokes;
  }

  /**
   * Generate additional jokes when we need more unique content
   * @param {number} count - Number of additional jokes to generate
   * @returns {Promise<Array>} Array of additional jokes
   */
  async generateAdditionalJokes(count) {
    // Initialize fetch first
    await this.initializeFetch();
    
    if (!this.openaiApiKey) {
      return this.getFallbackJokes().slice(0, count);
    }

    try {
      const prompt = `Generate ${count} more high-quality PUNS that are:
1. Clean and family-friendly
2. Clever wordplay and double meanings
3. Short and punchy (1-2 sentences max)
4. Creative and original puns
5. Actually funny (not just bad wordplay)
6. Focus on clever language tricks and homophones
7. Different from common pun patterns

Format as JSON array with this structure:
[
  {
    "content": "pun text here",
    "category": "pun|wordplay|dad joke",
    "quality_score": 0.8
  }
]

Make sure each pun has a quality_score between 0.0 and 1.0, and only include puns with score >= 0.7.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional comedy writer specializing in clever puns and wordplay. You excel at creating clean, family-friendly puns that are genuinely funny, clever, and original.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.9 // Higher temperature for more variety
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response
      const jokes = JSON.parse(content);
      
      // Filter by quality score
      const highQualityJokes = jokes.filter(joke => 
        joke.quality_score >= this.qualityThreshold
      );

      console.log(`Generated ${highQualityJokes.length} additional high-quality puns`);
      return highQualityJokes;

    } catch (error) {
      console.error('Error generating additional jokes with OpenAI:', error);
      return this.getFallbackJokes().slice(0, count);
    }
  }
}

module.exports = JokeGenerator;
