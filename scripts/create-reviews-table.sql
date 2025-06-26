-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Insert sample reviews for existing spaces
INSERT INTO reviews (space_id, user_id, rating, comment, created_at) VALUES
-- Reviews for space 73bef0f1-d91c-49b4-9520-dcf43f976250
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Excellent parking space! Very secure and convenient location near the station.', '2024-01-20T10:30:00Z'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Good value for money. Easy access and well-lit area. Would recommend to others.', '2024-01-18T14:20:00Z'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Perfect for daily commuting. Highly recommend! Safe and secure parking.', '2024-01-15T09:15:00Z'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Great location, close to transport links. Booking process was smooth and easy.', '2024-01-12T16:45:00Z'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Outstanding service and very reliable. The space is exactly as described.', '2024-01-10T11:30:00Z'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Clean, safe, and well-maintained parking area. Good communication from owner.', '2024-01-08T13:20:00Z'),

-- Reviews for any other spaces that exist
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 5, 'Fantastic parking space in a prime location. Will definitely book again.', '2024-01-19T08:15:00Z'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 4, 'Very convenient and reasonably priced. Easy to find and access.', '2024-01-17T15:40:00Z'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 5, 'Excellent security features and great location for shopping center access.', '2024-01-14T12:25:00Z'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 4, 'Good parking space with reliable access. Host was very helpful.', '2024-01-11T09:50:00Z'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 5, 'Perfect for weekend trips. Secure and well-maintained facility.', '2024-01-09T14:30:00Z'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', gen_random_uuid(), 4, 'Great value and convenient location. Would use again for sure.', '2024-01-06T11:15:00Z');
