const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Mock data storage (in-memory for testing)
let jokes = [
  {
    id: '1',
    content: 'I used to play piano by ear, but now I use my hands.',
    up_votes: 15,
    down_votes: 3,
    total_votes: 18,
    rating_percentage: 83,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    content: 'Why did the scarecrow win an award? He was outstanding in his field.',
    up_votes: 22,
    down_votes: 1,
    total_votes: 23,
    rating_percentage: 96,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    content: 'I told my computer I needed a break — it said "No problem, I\'ll go to sleep."',
    up_votes: 8,
    down_votes: 5,
    total_votes: 13,
    rating_percentage: 62,
    created_at: new Date().toISOString()
  }
];

let submissions = [
  {
    id: 'sub1',
    content: 'Why don\'t scientists trust atoms? Because they make up everything.',
    submitted_by: 'test_user',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: 'sub2',
    content: 'I don\'t trust stairs — they\'re always up to something.',
    submitted_by: 'another_user',
    status: 'pending',
    created_at: new Date().toISOString()
  }
];

let ratings = {};

// API Routes

// Get all jokes
app.get('/api/jokes', (req, res) => {
  res.json({
    success: true,
    jokes: jokes
  });
});

// Submit a new joke
app.post('/api/jokes', (req, res) => {
  const { content, submitted_by } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Joke content is required' });
  }
  
  if (content.length > 500) {
    return res.status(400).json({ error: 'Joke content is too long (max 500 characters)' });
  }
  
  const newSubmission = {
    id: `sub_${Date.now()}`,
    content: content.trim(),
    submitted_by: submitted_by || 'anonymous',
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  submissions.push(newSubmission);
  
  res.status(201).json({
    success: true,
    message: 'Joke submitted successfully! It will be reviewed before being added.',
    submission_id: newSubmission.id
  });
});

// Rate a joke
app.post('/api/rate', (req, res) => {
  const { joke_id, user_id, rating } = req.body;
  
  if (!joke_id || !user_id || !rating) {
    return res.status(400).json({ error: 'joke_id, user_id, and rating are required' });
  }
  
  if (![1, -1].includes(rating)) {
    return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
  }
  
  const joke = jokes.find(j => j.id === joke_id);
  if (!joke) {
    return res.status(404).json({ error: 'Joke not found' });
  }
  
  const ratingKey = `${joke_id}_${user_id}`;
  const previousRating = ratings[ratingKey];
  
  // Remove previous rating if exists
  if (previousRating) {
    joke[previousRating === 1 ? 'up_votes' : 'down_votes']--;
    joke.total_votes--;
  }
  
  // Add new rating or remove if same
  if (previousRating === rating) {
    // Remove rating
    delete ratings[ratingKey];
    res.json({
      success: true,
      action: 'removed',
      message: 'Rating removed'
    });
  } else {
    // Add/update rating
    ratings[ratingKey] = rating;
    joke[rating === 1 ? 'up_votes' : 'down_votes']++;
    joke.total_votes++;
    joke.rating_percentage = Math.round((joke.up_votes / joke.total_votes) * 100);
    
    res.json({
      success: true,
      action: previousRating ? 'updated' : 'added',
      message: previousRating ? 'Rating updated' : 'Rating added'
    });
  }
});

// Get submissions (admin)
app.get('/api/submissions', (req, res) => {
  const { status = 'pending' } = req.query;
  
  const filteredSubmissions = submissions.filter(s => s.status === status);
  
  res.json({
    success: true,
    submissions: filteredSubmissions
  });
});

// Review submission (admin)
app.post('/api/submissions', (req, res) => {
  const { submission_id, action, rejection_reason, reviewed_by } = req.body;
  
  if (!submission_id || !action) {
    return res.status(400).json({ error: 'submission_id and action are required' });
  }
  
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
  }
  
  const submission = submissions.find(s => s.id === submission_id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  if (submission.status !== 'pending') {
    return res.status(400).json({ error: 'Submission has already been reviewed' });
  }
  
  if (action === 'approve') {
    // Add to jokes
    const newJoke = {
      id: `joke_${Date.now()}`,
      content: submission.content,
      up_votes: 0,
      down_votes: 0,
      total_votes: 0,
      rating_percentage: 0,
      created_at: new Date().toISOString()
    };
    
    jokes.push(newJoke);
    
    // Update submission
    submission.status = 'approved';
    submission.reviewed_at = new Date().toISOString();
    submission.reviewed_by = reviewed_by || 'admin';
    
    res.json({
      success: true,
      message: 'Joke approved and added to the collection',
      joke_id: newJoke.id
    });
  } else {
    // Reject submission
    submission.status = 'rejected';
    submission.reviewed_at = new Date().toISOString();
    submission.reviewed_by = reviewed_by || 'admin';
    submission.rejection_reason = rejection_reason;
    
    res.json({
      success: true,
      message: 'Joke rejected'
    });
  }
});

// Serve the main extension page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'newtab.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log(`📱 Extension: http://localhost:${PORT}`);
  console.log(`🎛️  Admin: http://localhost:${PORT}/admin`);
  console.log(`\n📊 Mock data loaded:`);
  console.log(`   - ${jokes.length} jokes`);
  console.log(`   - ${submissions.length} pending submissions`);
  console.log(`\n💡 Tips:`);
  console.log(`   - Open Chrome and go to chrome://extensions/`);
  console.log(`   - Enable "Developer mode"`);
  console.log(`   - Click "Load unpacked" and select this folder`);
  console.log(`   - The extension will use the local API automatically`);
});
