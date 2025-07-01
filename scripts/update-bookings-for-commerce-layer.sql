-- Update bookings table to support Commerce Layer integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS duration_type TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing records to have proper status
UPDATE bookings SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Add some sample Commerce Layer SKUs for testing
INSERT INTO spaces (name, address, description, hourly_rate, daily_rate, monthly_rate, features, latitude, longitude, created_at)
VALUES 
  ('Commerce Layer Test Space', '456 Test Street, Demo City', 'Test parking space for Commerce Layer integration', 8.00, 45.00, 180.00, '["Covered", "Security", "EV Charging"]', 40.7128, -74.0060, NOW())
ON CONFLICT DO NOTHING;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
