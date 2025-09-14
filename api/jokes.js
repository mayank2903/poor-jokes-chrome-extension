const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const { validateRequest, logAPIError, logAPISuccess } = require('./validation');
const { sendSubmissionNotification } = require('../lib/gmail-notifications');

// Initialize Supabase clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enable CORS
const corsHandler = cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-version']
});

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => res.status(200).end());
  }

  // Apply CORS to all requests
  corsHandler(req, res, async () => {
    try {
      // Add validation middleware
      validateRequest(req, res, async () => {
        switch (req.method) {
          case 'GET':
            return await getJokes(req, res);
          case 'POST':
            return await submitJoke(req, res);
          default:
            return res.status(405).json({ error: 'Method not allowed' });
        }
      });
    } catch (error) {
      logAPIError(`${req.method} ${req.url}`, error, req.body);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Get all active jokes with their ratings
async function getJokes(req, res) {
  try {
    const { data: jokes, error: jokesError } = await supabase
      .from('jokes')
      .select(`
        id,
        content,
        created_at,
        joke_ratings (
          rating
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (jokesError) {
      throw jokesError;
    }

    // Calculate rating statistics for each joke
    const jokesWithRatings = jokes.map(joke => {
      const ratings = joke.joke_ratings || [];
      const upVotes = ratings.filter(r => r.rating === 1).length;
      const downVotes = ratings.filter(r => r.rating === -1).length;
      const totalVotes = upVotes + downVotes;
      const ratingPercentage = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;

      return {
        id: joke.id,
        content: joke.content,
        created_at: joke.created_at,
        up_votes: upVotes,
        down_votes: downVotes,
        total_votes: totalVotes,
        rating_percentage: ratingPercentage
      };
    });

    logAPISuccess('GET /api/jokes', 'fetch_jokes', { count: jokesWithRatings.length });
    return res.status(200).json({
      success: true,
      jokes: jokesWithRatings
    });
  } catch (error) {
    logAPIError('GET /api/jokes', error);
    return res.status(500).json({ error: 'Failed to fetch jokes' });
  }
}

// Submit a new joke
async function submitJoke(req, res) {
  try {
    const { content, submitted_by } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Joke content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Joke content is too long (max 500 characters)' });
    }

    const { data, error } = await supabaseAdmin
      .from('joke_submissions')
      .insert([
        {
          content: content.trim(),
          submitted_by: submitted_by || 'anonymous'
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logAPISuccess('POST /api/jokes', 'submit_joke', { submission_id: data.id });
    
    // Send Discord notification for new submission
    await sendSubmissionNotification(data);
    
    return res.status(201).json({
      success: true,
      message: 'Joke submitted successfully! It will be reviewed before being added.',
      submission_id: data.id
    });
  } catch (error) {
    logAPIError('POST /api/jokes', error, req.body);
    return res.status(500).json({ error: 'Failed to submit joke' });
  }
}
