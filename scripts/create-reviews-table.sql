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

-- Insert sample reviews using simple individual INSERT statements
INSERT INTO reviews (space_id, user_id, rating, comment, created_at) VALUES
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Excellent parking space! Very secure and convenient location near the station.', NOW() - INTERVAL '1 day'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Good value for money. Easy access and well-lit area. Would recommend to others.', NOW() - INTERVAL '2 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Perfect for daily commuting. Highly recommend! Safe and secure parking.', NOW() - INTERVAL '3 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Great location, close to transport links. Booking process was smooth and easy.', NOW() - INTERVAL '4 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Outstanding service and very reliable. The space is exactly as described.', NOW() - INTERVAL '5 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Clean, safe, and well-maintained parking area. Good communication from owner.', NOW() - INTERVAL '6 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 5, 'Fantastic parking space in a prime location. Will definitely book again.', NOW() - INTERVAL '7 days'),
('73bef0f1-d91c-49b4-9520-dcf43f976250', gen_random_uuid(), 4, 'Very convenient and reasonably priced. Easy to find and access.', NOW() - INTERVAL '8 days');

-- Add reviews for any other existing spaces
DO $$
DECLARE
    space_record RECORD;
BEGIN
    FOR space_record IN SELECT id FROM spaces WHERE id != '73bef0f1-d91c-49b4-9520-dcf43f976250' LOOP
        INSERT INTO reviews (space_id, user_id, rating, comment, created_at) VALUES
        (space_record.id, gen_random_uuid(), 5, 'Excellent security features and great location for shopping center access.', NOW() - INTERVAL '1 day'),
        (space_record.id, gen_random_uuid(), 4, 'Good parking space with reliable access. Host was very helpful.', NOW() - INTERVAL '2 days'),
        (space_record.id, gen_random_uuid(), 5, 'Perfect for weekend trips. Secure and well-maintained facility.', NOW() - INTERVAL '3 days'),
        (space_record.id, gen_random_uuid(), 4, 'Great value and convenient location. Would use again for sure.', NOW() - INTERVAL '4 days'),
        (space_record.id, gen_random_uuid(), 5, 'Outstanding parking experience. Highly recommend to others.', NOW() - INTERVAL '5 days'),
        (space_record.id, gen_random_uuid(), 4, 'Clean and secure parking with easy access. Good communication.', NOW() - INTERVAL '6 days');
    END LOOP;
END $$;
