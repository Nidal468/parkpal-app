-- Update bookings table to support Commerce Layer integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add some sample data for testing if the table is empty
INSERT INTO bookings (
  parking_space_id, 
  customer_name, 
  customer_email, 
  vehicle_registration, 
  start_date, 
  total_amount, 
  status,
  duration_type,
  sku
) 
SELECT 
  'test-space-1',
  'Test User',
  'test@example.com',
  'TEST123',
  CURRENT_DATE,
  25.00,
  'confirmed',
  'day',
  'parking-day'
WHERE NOT EXISTS (SELECT 1 FROM bookings LIMIT 1);
