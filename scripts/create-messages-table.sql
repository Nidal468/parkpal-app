-- Create messages table for storing chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- Enable Row Level Security (optional, for future user authentication)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true);
