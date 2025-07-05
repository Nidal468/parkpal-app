-- Create messages table for chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for chat history)
CREATE POLICY "Public can view messages" ON messages
  FOR SELECT USING (true);

-- Create policy to allow public insert (for new messages)
CREATE POLICY "Public can insert messages" ON messages
  FOR INSERT WITH CHECK (true);
