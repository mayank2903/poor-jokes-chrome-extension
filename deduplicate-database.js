#!/usr/bin/env node
/**
 * Script to deduplicate jokes in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deduplicateJokes() {
  console.log('🔍 Starting database deduplication...');
  console.log('=====================================\n');

  try {
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

    if (duplicates.length === 0) {
      console.log('🎉 No duplicates found! Database is clean.');
      return;
    }

    // Show duplicates that will be removed
    console.log('\n📝 Duplicates to be removed:');
    duplicates.forEach((duplicate, index) => {
      console.log(`${index + 1}. "${duplicate.content}" (ID: ${duplicate.id})`);
    });

    // Remove duplicates
    console.log('\n🗑️  Removing duplicates...');
    const duplicateIds = duplicates.map(d => d.id);
    
    const { error: deleteError } = await supabase
      .from('jokes')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      throw new Error(`Error deleting duplicates: ${deleteError.message}`);
    }

    console.log(`✅ Successfully removed ${duplicates.length} duplicate jokes`);
    console.log(`📊 Database now has ${uniqueJokes.length} unique jokes`);

    // Also check joke_submissions table
    console.log('\n🔍 Checking joke_submissions table...');
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
        }
      } else {
        console.log('✅ No duplicate submissions found');
      }
    }

    console.log('\n🎉 Database deduplication complete!');

  } catch (error) {
    console.error('❌ Error during deduplication:', error.message);
    process.exit(1);
  }
}

// Run deduplication
if (require.main === module) {
  deduplicateJokes();
}

module.exports = deduplicateJokes;
