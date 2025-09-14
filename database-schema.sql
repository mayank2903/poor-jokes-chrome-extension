-- Database schema for Poor Jokes New Tab Extension

-- Jokes table - stores all approved jokes
CREATE TABLE jokes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Joke submissions table - stores user-submitted jokes awaiting moderation
CREATE TABLE joke_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  submitted_by TEXT, -- Optional: user identifier
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  rejection_reason TEXT
);

-- Joke ratings table - stores user ratings for jokes
CREATE TABLE joke_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joke_id UUID REFERENCES jokes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Browser fingerprint or user identifier
  rating INTEGER NOT NULL CHECK (rating IN (1, -1)), -- 1 for thumbs up, -1 for thumbs down
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(joke_id, user_id)
);

-- Insert initial jokes from the original jokes.js file
INSERT INTO jokes (content) VALUES
  ('I used to play piano by ear, but now I use my hands.'),
  ('Why did the scarecrow win an award? He was outstanding in his field.'),
  ('I told my computer I needed a break — it said ''No problem, I''ll go to sleep.'''),
  ('Parallel lines have so much in common. It''s a shame they''ll never meet.'),
  ('Why don''t skeletons fight each other? They don''t have the guts.'),
  ('I would tell you a construction joke, but I''m still working on it.'),
  ('What do you call fake spaghetti? An impasta.'),
  ('Why was the math book sad? It had too many problems.'),
  ('I asked the librarian if the library had books on paranoia. She whispered, ''They''re right behind you.'''),
  ('I told a joke about a roof once — it went over people''s heads.'),
  ('Why did the tomato turn red? Because it saw the salad dressing.'),
  ('I''m reading a book about anti-gravity. It''s impossible to put down.'),
  ('Why did the bicycle fall over? It was two tired.'),
  ('I used to be a baker, but I couldn''t make enough dough.'),
  ('What do you call cheese that isn''t yours? Nacho cheese.'),
  ('I told my bed a joke, it said ''I''ll sleep on it.'''),
  ('Why don''t eggs tell jokes? They''d crack each other up.'),
  ('How do you organize a space party? You planet.'),
  ('I tried to catch fog yesterday. I mist.'),
  ('What do you call a factory that makes okay products? A satisfactory.'),
  ('I asked the gym instructor if he could teach me to do the splits. He said, ''How flexible are you?'' I said, ''I can''t make Tuesdays.'''),
  ('What do you call an alligator in a vest? An investigator.'),
  ('Why did the coffee file a police report? It got mugged.'),
  ('I used to be addicted to soap — but I''m clean now.'),
  ('Why don''t scientists trust atoms? Because they make up everything.'),
  ('I don''t trust stairs — they''re always up to something.'),
  ('What does a nosy pepper do? It gets jalapeño business.'),
  ('Why did the cookie go to the hospital? Because he felt crumby.'),
  ('I tried to make a belt out of watches — it was a waist of time.'),
  ('How does a penguin build its house? Igloos it together.');

-- Create indexes for better performance
CREATE INDEX idx_jokes_active ON jokes(is_active);
CREATE INDEX idx_joke_ratings_joke_id ON joke_ratings(joke_id);
CREATE INDEX idx_joke_ratings_user_id ON joke_ratings(user_id);
CREATE INDEX idx_joke_submissions_status ON joke_submissions(status);
CREATE INDEX idx_joke_submissions_created_at ON joke_submissions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE joke_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE joke_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to active jokes" ON jokes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public insert to joke submissions" ON joke_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to joke ratings" ON joke_ratings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to joke ratings" ON joke_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of own joke ratings" ON joke_ratings
  FOR UPDATE USING (true);
