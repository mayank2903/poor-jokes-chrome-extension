const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const { validateRequest, logAPIError, logAPISuccess } = require('./validation');
const { sendApprovalNotification, sendRejectionNotification } = require('../lib/telegram-notifications');
const { formatJokeContent, formatSubmitterName, validateJokeQuality } = require('../lib/joke-formatter');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enable CORS
const corsHandler = cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password', 'x-api-version']
});

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => res.status(200).end());
  }

  // Apply CORS to all requests
  corsHandler(req, res, async () => {
    try {
      // Check admin authentication
      const adminPassword = req.headers['x-admin-password'];
      const expectedPassword = process.env.ADMIN_PASSWORD || 'PoorJokes2024!Admin';
      if (adminPassword !== expectedPassword) {
        return res.status(401).json({ error: 'Unauthorized access' });
      }

      // Add validation middleware
      validateRequest(req, res, async () => {
        switch (req.method) {
          case 'GET':
            return await getSubmissions(req, res);
          case 'POST':
            return await reviewSubmission(req, res);
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

// Get all joke submissions for moderation
async function getSubmissions(req, res) {
  try {
    const { status = 'pending' } = req.query;

    const { data: submissions, error } = await supabase
      .from('joke_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      submissions: submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

// Review a submission (approve or reject)
async function reviewSubmission(req, res) {
  try {
    const { submission_id, action, rejection_reason, reviewed_by } = req.body;

    if (!submission_id || !action) {
      return res.status(400).json({ error: 'submission_id and action are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    // Rejection reason is optional - no validation needed

    // Get the submission first
    const { data: submission, error: fetchError } = await supabase
      .from('joke_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission has already been reviewed' });
    }

    if (action === 'approve') {
      // Format the joke content before adding to main table
      const contentResult = formatJokeContent(submission.content);
      
      if (!contentResult.isValid) {
        return res.status(400).json({
          error: 'Cannot approve joke with invalid content',
          details: contentResult.errors
        });
      }

      // Check for duplicates before approving
      const { data: existingJokes, error: duplicateError } = await supabase
        .from('jokes')
        .select('id, content')
        .eq('is_active', true)
        .ilike('content', contentResult.formatted);

      if (duplicateError) {
        throw duplicateError;
      }

      if (existingJokes && existingJokes.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate joke detected',
          message: 'This joke already exists in the active jokes collection.',
          duplicate_jokes: existingJokes.map(joke => ({
            id: joke.id,
            content: joke.content
          }))
        });
      }

      // Validate joke quality
      const qualityCheck = validateJokeQuality(contentResult.formatted);
      
      // Add the joke to the main jokes table with formatted content
      const { data: newJoke, error: insertError } = await supabase
        .from('jokes')
        .insert([
          {
            content: contentResult.formatted
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Update submission status
      const { error: updateError } = await supabase
        .from('joke_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewed_by || 'admin'
        })
        .eq('id', submission_id);

      if (updateError) {
        throw updateError;
      }

      // Send approval notification
      await sendApprovalNotification(submission);

      return res.status(200).json({
        success: true,
        message: 'Joke approved and added to the collection',
        joke_id: newJoke.id
      });
    } else {
      // Reject the submission
      const { error: updateError } = await supabase
        .from('joke_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewed_by || 'admin',
          rejection_reason: rejection_reason
        })
        .eq('id', submission_id);

      if (updateError) {
        throw updateError;
      }

      // Send rejection notification
      await sendRejectionNotification(submission, rejection_reason);

      return res.status(200).json({
        success: true,
        message: 'Joke rejected'
      });
    }
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return res.status(500).json({ error: 'Failed to review submission' });
  }
}
