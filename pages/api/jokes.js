const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getJokes(req, res);
      case 'POST':
        return await submitJoke(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

    return res.status(200).json({
      success: true,
      jokes: jokesWithRatings
    });
  } catch (error) {
    console.error('Error fetching jokes:', error);
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

    const { data, error } = await supabase
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

    return res.status(201).json({
      success: true,
      message: 'Joke submitted successfully! It will be reviewed before being added.',
      submission_id: data.id
    });
  } catch (error) {
    console.error('Error submitting joke:', error);
    return res.status(500).json({ error: 'Failed to submit joke' });
  }
}
