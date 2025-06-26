-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Insert sample reviews for testing
INSERT INTO reviews (space_id, user_id, rating, comment, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5, 'Excellent parking space! Very secure and easy to access. Would definitely book again.', '2024-01-15 10:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 4, 'Great location and good value for money. Only minor issue was the entrance was a bit narrow.', '2024-01-10 14:20:00+00'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 5, 'Perfect spot for city parking. Clean, safe, and exactly as described.', '2024-01-05 09:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 4, 'Good parking space, convenient location near the station.', '2024-01-12 16:45:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 5, 'Amazing! Host was very responsive and the space was exactly as advertised.', '2024-01-08 11:30:00+00');
