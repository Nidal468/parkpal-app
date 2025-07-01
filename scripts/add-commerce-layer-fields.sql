-- Add Commerce Layer fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_order_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_customer_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_market_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS duration_type TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_order ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_customer_id ON bookings(commerce_layer_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- Add some sample data for testing
INSERT INTO bookings (
  user_id, 
  space_id, 
  customer_name, 
  customer_email, 
  vehicle_registration, 
  total_price, 
  status,
  start_time,
  end_time,
  created_at,
  payment_status,
  confirmed_at
) VALUES (
  'test-user-1',
  'test-space-1', 
  'Test Customer',
  'test@example.com',
  'TEST123',
  10.00,
  'completed',
  NOW(),
  NOW() + INTERVAL '1 hour',
  NOW(),
  'pending',
  NULL
) ON CONFLICT DO NOTHING;

-- Update existing bookings to have default payment status
UPDATE bookings SET payment_status = 'pending' WHERE payment_status IS NULL;
