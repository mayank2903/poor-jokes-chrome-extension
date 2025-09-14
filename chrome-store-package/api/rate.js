const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

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
  methods: ['POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => res.status(200).end());
  }

  // Apply CORS to all requests
  corsHandler(req, res, async () => {
    try {
      if (req.method === 'POST') {
        return await rateJoke(req, res);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Rate a joke (thumbs up or down)
async function rateJoke(req, res) {
  try {
    const { joke_id, user_id, rating } = req.body;

    if (!joke_id || !user_id || !rating) {
      return res.status(400).json({ error: 'joke_id, user_id, and rating are required' });
    }

    if (![1, -1].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
    }

    // Check if user has already rated this joke
    const { data: existingRating, error: fetchError } = await supabaseAdmin
      .from('joke_ratings')
      .select('id, rating')
      .eq('joke_id', joke_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw fetchError;
    }

    if (existingRating) {
      // User has already rated this joke
      if (existingRating.rating === rating) {
        // Same rating - remove it
        const { error: deleteError } = await supabaseAdmin
          .from('joke_ratings')
          .delete()
          .eq('id', existingRating.id);

        if (deleteError) {
          throw deleteError;
        }

        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Rating removed'
        });
      } else {
        // Different rating - update it
        const { error: updateError } = await supabaseAdmin
          .from('joke_ratings')
          .update({ 
            rating: rating,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id);

        if (updateError) {
          throw updateError;
        }

        return res.status(200).json({
          success: true,
          action: 'updated',
          message: 'Rating updated'
        });
      }
    } else {
      // New rating - insert it
      const { error: insertError } = await supabaseAdmin
        .from('joke_ratings')
        .insert([
          {
            joke_id: joke_id,
            user_id: user_id,
            rating: rating
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      return res.status(201).json({
        success: true,
        action: 'added',
        message: 'Rating added'
      });
    }
  } catch (error) {
    console.error('Error rating joke:', error);
    return res.status(500).json({ error: 'Failed to rate joke' });
  }
}
