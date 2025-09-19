/**
 * API endpoint to deduplicate jokes in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Skip password check for now - you can add it back later
  // const { password } = req.body;
  // if (password !== process.env.ADMIN_PASSWORD) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    console.log('🔍 Starting database deduplication...');

    // Get all jokes from the main jokes table
    const { data: jokes, error: jokesError } = await supabase
      .from('jokes')
      .select('*')
      .order('created_at', { ascending: true });

    if (jokesError) {
      throw new Error(`Error fetching jokes: ${jokesError.message}`);
    }

    console.log(`📊 Found ${jokes.length} jokes in database`);

    // Group jokes by normalized content
    const contentGroups = {};
    const duplicates = [];
    const uniqueJokes = [];

    jokes.forEach(joke => {
      // Normalize content for comparison
      const normalized = joke.content.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (!contentGroups[normalized]) {
        contentGroups[normalized] = [];
      }
      contentGroups[normalized].push(joke);
    });

    // Find duplicates
    Object.values(contentGroups).forEach(group => {
      if (group.length > 1) {
        // Keep the first one (oldest), mark others as duplicates
        const [keep, ...dups] = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        uniqueJokes.push(keep);
        duplicates.push(...dups);
      } else {
        uniqueJokes.push(group[0]);
      }
    });

    console.log(`✅ Found ${uniqueJokes.length} unique jokes`);
    console.log(`🚫 Found ${duplicates.length} duplicate jokes`);

    let result = {
      success: true,
      totalJokes: jokes.length,
      uniqueJokes: uniqueJokes.length,
      duplicatesRemoved: 0,
      duplicateDetails: []
    };

    if (duplicates.length === 0) {
      console.log('🎉 No duplicates found! Database is clean.');
      return res.json({ ...result, message: 'No duplicates found! Database is clean.' });
    }

    // Show duplicates that will be removed
    duplicates.forEach((duplicate, index) => {
      result.duplicateDetails.push({
        id: duplicate.id,
        content: duplicate.content,
        created_at: duplicate.created_at
      });
    });

    // Remove duplicates
    console.log('🗑️  Removing duplicates...');
    const duplicateIds = duplicates.map(d => d.id);
    
    const { error: deleteError } = await supabase
      .from('jokes')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      throw new Error(`Error deleting duplicates: ${deleteError.message}`);
    }

    result.duplicatesRemoved = duplicates.length;
    console.log(`✅ Successfully removed ${duplicates.length} duplicate jokes`);

    // Also check joke_submissions table
    console.log('🔍 Checking joke_submissions table...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('joke_submissions')
      .select('*');

    if (submissionsError) {
      console.log(`⚠️  Could not check submissions: ${submissionsError.message}`);
    } else {
      console.log(`📊 Found ${submissions.length} submissions`);
      
      // Group submissions by content
      const submissionGroups = {};
      submissions.forEach(sub => {
        const normalized = sub.content.toLowerCase().trim().replace(/\s+/g, ' ');
        if (!submissionGroups[normalized]) {
          submissionGroups[normalized] = [];
        }
        submissionGroups[normalized].push(sub);
      });

      // Find duplicate submissions
      const duplicateSubmissions = [];
      Object.values(submissionGroups).forEach(group => {
        if (group.length > 1) {
          const [keep, ...dups] = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          duplicateSubmissions.push(...dups);
        }
      });

      if (duplicateSubmissions.length > 0) {
        console.log(`🚫 Found ${duplicateSubmissions.length} duplicate submissions`);
        
        const submissionIds = duplicateSubmissions.map(s => s.id);
        const { error: deleteSubError } = await supabase
          .from('joke_submissions')
          .delete()
          .in('id', submissionIds);

        if (deleteSubError) {
          console.log(`⚠️  Could not delete duplicate submissions: ${deleteSubError.message}`);
        } else {
          console.log(`✅ Removed ${duplicateSubmissions.length} duplicate submissions`);
          result.duplicateSubmissionsRemoved = duplicateSubmissions.length;
        }
      } else {
        console.log('✅ No duplicate submissions found');
      }
    }

    console.log('🎉 Database deduplication complete!');
    return res.json({ ...result, message: 'Database deduplication complete!' });

  } catch (error) {
    console.error('❌ Error during deduplication:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

module.exports = handler;
