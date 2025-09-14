/**
 * @fileoverview Database service with connection management and query helpers
 */

const { createClient } = require('@supabase/supabase-js');
const { APP_CONSTANTS } = require('../../../shared/constants');

/**
 * Database service class
 */
class DatabaseService {
  constructor() {
    this.supabase = null;
    this.serviceSupabase = null;
    this.initialized = false;
  }

  /**
   * Initialize database connections
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Initialize public client
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Initialize service role client for admin operations
    if (supabaseServiceKey) {
      this.serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    this.initialized = true;
    console.log('Database service initialized');
  }

  /**
   * Get Supabase client
   * @param {boolean} useServiceRole - Whether to use service role client
   * @returns {Object} Supabase client
   */
  getClient(useServiceRole = false) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (useServiceRole && this.serviceSupabase) {
      return this.serviceSupabase;
    }

    return this.supabase;
  }

  /**
   * Get jokes with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of jokes
   */
  async getJokes(options = {}) {
    const client = this.getClient();
    let query = client.from('jokes').select('*');

    // Apply filters
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch jokes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single joke by ID
   * @param {string} jokeId - Joke ID
   * @returns {Promise<Object|null>} Joke object or null
   */
  async getJokeById(jokeId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('jokes')
      .select('*')
      .eq('id', jokeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch joke: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new joke
   * @param {Object} jokeData - Joke data
   * @returns {Promise<Object>} Created joke
   */
  async createJoke(jokeData) {
    const client = this.getClient();
    const { data, error } = await client
      .from('jokes')
      .insert([jokeData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create joke: ${error.message}`);
    }

    return data;
  }

  /**
   * Update joke rating
   * @param {string} jokeId - Joke ID
   * @param {string} rating - Rating type ('up' or 'down')
   * @returns {Promise<Object>} Updated joke
   */
  async updateJokeRating(jokeId, rating) {
    const client = this.getClient();
    
    // Get current joke data
    const joke = await this.getJokeById(jokeId);
    if (!joke) {
      throw new Error('Joke not found');
    }

    // Update vote counts
    const updates = {
      up_votes: joke.up_votes || 0,
      down_votes: joke.down_votes || 0
    };

    if (rating === APP_CONSTANTS.RATING_TYPES.UP) {
      updates.up_votes += 1;
    } else if (rating === APP_CONSTANTS.RATING_TYPES.DOWN) {
      updates.down_votes += 1;
    }

    // Calculate new totals and percentage
    updates.total_votes = updates.up_votes + updates.down_votes;
    updates.rating_percentage = updates.total_votes > 0 
      ? Math.round((updates.up_votes / updates.total_votes) * 100)
      : 0;

    const { data, error } = await client
      .from('jokes')
      .update(updates)
      .eq('id', jokeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update joke rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Get submissions with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of submissions
   */
  async getSubmissions(options = {}) {
    const client = this.getClient(true); // Use service role for admin operations
    
    let query = client.from('joke_submissions').select('*');

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new submission
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Created submission
   */
  async createSubmission(submissionData) {
    const client = this.getClient();
    const { data, error } = await client
      .from('joke_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create submission: ${error.message}`);
    }

    return data;
  }

  /**
   * Update submission status
   * @param {string} submissionId - Submission ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated submission
   */
  async updateSubmission(submissionId, updateData) {
    const client = this.getClient(true); // Use service role for admin operations
    const { data, error } = await client
      .from('joke_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update submission: ${error.message}`);
    }

    return data;
  }

  /**
   * Get submission by ID
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object|null>} Submission object or null
   */
  async getSubmissionById(submissionId) {
    const client = this.getClient(true); // Use service role for admin operations
    const { data, error } = await client
      .from('joke_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch submission: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if user has already rated a joke
   * @param {string} jokeId - Joke ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has rated
   */
  async hasUserRated(jokeId, userId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('joke_ratings')
      .select('id')
      .eq('joke_id', jokeId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check rating: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Record user rating
   * @param {string} jokeId - Joke ID
   * @param {string} userId - User ID
   * @param {string} rating - Rating type
   * @returns {Promise<Object>} Created rating record
   */
  async recordRating(jokeId, userId, rating) {
    const client = this.getClient();
    const { data, error } = await client
      .from('joke_ratings')
      .insert([{
        joke_id: jokeId,
        user_id: userId,
        rating: rating
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    const client = this.getClient();
    
    const [jokesResult, submissionsResult, ratingsResult] = await Promise.all([
      client.from('jokes').select('id', { count: 'exact' }),
      client.from('joke_submissions').select('id', { count: 'exact' }),
      client.from('joke_ratings').select('id', { count: 'exact' })
    ]);

    return {
      totalJokes: jokesResult.count || 0,
      totalSubmissions: submissionsResult.count || 0,
      totalRatings: ratingsResult.count || 0
    };
  }

  /**
   * Health check
   * @returns {Promise<boolean>} Whether database is healthy
   */
  async healthCheck() {
    try {
      const client = this.getClient();
      const { error } = await client.from('jokes').select('id').limit(1);
      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
