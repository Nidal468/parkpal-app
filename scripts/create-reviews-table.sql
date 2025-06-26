-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Insert sample reviews
INSERT INTO reviews (space_id, rating, comment, created_at) VALUES
  ((SELECT id FROM spaces WHERE title LIKE '%Ambergate%' LIMIT 1), 5, 'Excellent parking space! Very secure and easy to access. Would definitely book again.', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Ambergate%' LIMIT 1), 4, 'Great location and good value for money. Only minor issue was the entrance was a bit narrow.', NOW() - INTERVAL '10 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Ambergate%' LIMIT 1), 5, 'Perfect spot for city parking. Clean, safe, and exactly as described.', NOW() - INTERVAL '15 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Borough%' LIMIT 1), 4, 'Good parking space, convenient location near the station.', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Borough%' LIMIT 1), 3, 'Decent space but a bit tight for larger vehicles.', NOW() - INTERVAL '8 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Kennington%' LIMIT 1), 5, 'Amazing parking spot! Close to everything and very secure.', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM spaces WHERE title LIKE '%Kennington%' LIMIT 1), 4, 'Really good value and the owner was very helpful.', NOW() - INTERVAL '12 days');
