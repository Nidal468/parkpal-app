-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Insert sample reviews for testing
INSERT INTO reviews (space_id, user_id, rating, comment, created_at) 
SELECT 
    s.id,
    gen_random_uuid(),
    (RANDOM() * 4 + 1)::INTEGER, -- Random rating between 1-5
    CASE 
        WHEN (RANDOM() * 4 + 1)::INTEGER >= 4 THEN 'Excellent parking space! Very convenient and secure.'
        WHEN (RANDOM() * 4 + 1)::INTEGER >= 3 THEN 'Good location and fair price. Would recommend.'
        ELSE 'Decent parking spot, easy to access.'
    END,
    NOW() - (RANDOM() * INTERVAL '30 days')
FROM spaces s
WHERE s.id IN (
    SELECT id FROM spaces LIMIT 10
)
ON CONFLICT DO NOTHING;

-- Add a few more specific reviews
INSERT INTO reviews (space_id, user_id, rating, comment, created_at) VALUES
(
    (SELECT id FROM spaces LIMIT 1),
    gen_random_uuid(),
    5,
    'Perfect for daily commuting. The space is always clean and well-lit. Highly recommend!',
    NOW() - INTERVAL '5 days'
),
(
    (SELECT id FROM spaces LIMIT 1),
    gen_random_uuid(),
    4,
    'Great value for money in this area. Easy to book and the host is very responsive.',
    NOW() - INTERVAL '10 days'
),
(
    (SELECT id FROM spaces LIMIT 1),
    gen_random_uuid(),
    5,
    'Excellent location near the station. Secure parking with CCTV coverage.',
    NOW() - INTERVAL '15 days'
)
ON CONFLICT DO NOTHING;
