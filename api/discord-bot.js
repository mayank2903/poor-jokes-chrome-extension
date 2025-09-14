// Discord bot handler for interactive buttons
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enable CORS
const corsHandler = cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
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
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { type, data } = req.body;

      // Handle Discord interaction
      if (type === 1) {
        // PING - Discord verification
        return res.status(200).json({ type: 1 });
      }

      if (type === 3) {
        // BUTTON_INTERACTION - Handle button clicks
        const { custom_id } = data;
        
        if (custom_id.startsWith('approve_') || custom_id.startsWith('reject_')) {
          const submissionId = custom_id.split('_')[1];
          const action = custom_id.split('_')[0];
          
          // Get the submission
          const { data: submission, error: fetchError } = await supabase
            .from('joke_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

          if (fetchError || !submission) {
            return res.status(200).json({
              type: 4,
              data: {
                content: '❌ Submission not found or already reviewed.',
                flags: 64 // Ephemeral (only visible to the user who clicked)
              }
            });
          }

          if (submission.status !== 'pending') {
            return res.status(200).json({
              type: 4,
              data: {
                content: '❌ This submission has already been reviewed.',
                flags: 64
              }
            });
          }

          if (action === 'approve') {
            // Approve the submission
            const { data: newJoke, error: insertError } = await supabase
              .from('jokes')
              .insert([{ content: submission.content }])
              .select()
              .single();

            if (insertError) {
              return res.status(200).json({
                type: 4,
                data: {
                  content: '❌ Failed to approve joke. Please try again.',
                  flags: 64
                }
              });
            }

            // Update submission status
            await supabase
              .from('joke_submissions')
              .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'discord_bot'
              })
              .eq('id', submissionId);

            return res.status(200).json({
              type: 4,
              data: {
                content: `✅ **Joke approved!**\n\n**Joke ID:** ${submissionId}\n**Content:** ${submission.content}\n\nJoke has been added to the collection.`,
                flags: 0
              }
            });
          } else {
            // Reject the submission
            await supabase
              .from('joke_submissions')
              .update({
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'discord_bot',
                rejection_reason: 'Rejected via Discord'
              })
              .eq('id', submissionId);

            return res.status(200).json({
              type: 4,
              data: {
                content: `❌ **Joke rejected.**\n\n**Joke ID:** ${submissionId}\n**Content:** ${submission.content}\n\nReason: Rejected via Discord`,
                flags: 0
              }
            });
          }
        }
      }

      return res.status(400).json({ error: 'Invalid interaction type' });
    } catch (error) {
      console.error('Discord bot error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
