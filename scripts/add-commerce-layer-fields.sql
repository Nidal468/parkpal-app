-- Add Commerce Layer specific fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS sku VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS commerce_layer_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_order ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing bookings to have default values
UPDATE bookings 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Add some sample test data for testing
INSERT INTO bookings (
  user_id, 
  space_id, 
  customer_name, 
  customer_email, 
  vehicle_registration,
  total_price,
  status,
  sku,
  duration_type,
  start_time,
  end_time,
  created_at
) VALUES 
(
  'test-user-1',
  'test-space-1', 
  'Test Customer',
  'test@example.com',
  'TEST123',
  8.00,
  'pending',
  'parking_hour_test',
  'hour',
  NOW(),
  NOW() + INTERVAL '1 hour',
  NOW()
) ON CONFLICT DO NOTHING;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
