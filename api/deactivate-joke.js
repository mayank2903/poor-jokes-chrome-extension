/**
 * API endpoint to deactivate a joke
 */

const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS configuration
const corsHandler = cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-password']
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
        return await handleDeactivateJoke(req, res);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Deactivate joke error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

async function handleDeactivateJoke(req, res) {
  const { joke_id, admin_password } = req.body;

  // Check admin password
  const expectedPassword = process.env.ADMIN_PASSWORD || 'PoorJokes2024!Admin';
  if (admin_password !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (!joke_id) {
    return res.status(400).json({ error: 'Joke ID is required' });
  }

  try {
    // Update the joke to set is_active = false
    const { data, error } = await supabase
      .from('jokes')
      .update({ is_active: false })
      .eq('id', joke_id)
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Joke deactivated successfully',
        joke: data[0]
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Joke not found or already inactive'
      });
    }

  } catch (error) {
    console.error('Error deactivating joke:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to deactivate joke'
    });
  }
}
