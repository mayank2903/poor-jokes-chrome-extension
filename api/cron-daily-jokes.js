/**
 * @fileoverview Cron job for daily joke generation
 * This endpoint is called by Vercel Cron Jobs daily at 9 AM IST (3:30 AM UTC)
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
 * Main cron job handler
 */
export default async function handler(req, res) {
  // Only allow POST requests (Vercel Cron Jobs send POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify this is a legitimate cron request
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    console.log('Unauthorized cron request');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🕘 Daily joke generation cron job started...');
    
    const generator = new JokeGenerator();
    const jokes = await generator.generateDailyJokes();
    
    if (jokes.length === 0) {
      console.log('❌ No valid jokes generated');
      return res.status(200).json({ 
        success: false, 
        message: 'No valid jokes generated',
        timestamp: new Date().toISOString()
      });
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('Error processing joke:', error);
      }
    }

    console.log(`🎉 Daily cron job completed: ${submissions.length} jokes submitted`);
    
    return res.status(200).json({
      success: true,
      message: `Generated and submitted ${submissions.length} jokes`,
      submissions: submissions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in daily joke cron job:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating daily jokes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
