/**
 * @fileoverview Daily joke generation and submission API
 */

const JokeGenerator = require('../lib/joke-generator');
const { sendSubmissionNotification } = require('../lib/telegram-notifications');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Generate and submit daily jokes for approval
 */
async function generateDailyJokes() {
  try {
    console.log('🚀 Starting daily joke generation...');
    
    const generator = new JokeGenerator();
    const jokes = await generator.generateDailyJokes();
    
    if (jokes.length === 0) {
      console.log('❌ No valid jokes generated');
      return { success: false, message: 'No valid jokes generated' };
    }

    // Submit each joke to the database as pending
    const submissions = [];
    
    for (const joke of jokes) {
      try {
        const { data: submission, error } = await supabase
          .from('joke_submissions')
          .insert({
            content: joke.content,
            submitted_by: 'AI Daily Generator',
            status: 'pending',
            category: joke.category,
            quality_score: joke.quality_score,
            source: 'daily_auto_generation'
          })
          .select()
          .single();

        if (error) {
          console.error('Error submitting joke:', error);
          continue;
        }

        submissions.push(submission);
        
        // Send Telegram notification for approval
        await sendSubmissionNotification(submission);
        
        console.log(`✅ Submitted joke: ${joke.content.substring(0, 50)}...`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error processing joke:', error);
      }
    }

    console.log(`🎉 Successfully generated and submitted ${submissions.length} jokes`);
    
    return {
      success: true,
      message: `Generated and submitted ${submissions.length} jokes`,
      submissions: submissions.length
    };

  } catch (error) {
    console.error('Error in daily joke generation:', error);
    return {
      success: false,
      message: 'Error generating daily jokes',
      error: error.message
    };
  }
}

/**
 * Get daily joke generation statistics
 */
async function getDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todaySubmissions, error } = await supabase
      .from('joke_submissions')
      .select('*')
      .eq('source', 'daily_auto_generation')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (error) {
      throw error;
    }

    const stats = {
      today: {
        total: todaySubmissions.length,
        pending: todaySubmissions.filter(s => s.status === 'pending').length,
        approved: todaySubmissions.filter(s => s.status === 'approved').length,
        rejected: todaySubmissions.filter(s => s.status === 'rejected').length
      }
    };

    return { success: true, stats };

  } catch (error) {
    console.error('Error getting daily stats:', error);
    return { success: false, error: error.message };
  }
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Get daily statistics
    const result = await getDailyStats();
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    // Check for admin authorization
    const adminPassword = req.headers['x-admin-password'];
    const expectedPassword = process.env.ADMIN_PASSWORD || 'PoorJokes2024!Admin';
    
    if (adminPassword !== expectedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Admin password required'
      });
    }

    // Generate daily jokes
    const result = await generateDailyJokes();
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
