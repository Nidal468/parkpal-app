-- Add Commerce Layer specific fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS sku VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS commerce_layer_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS commerce_layer_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS commerce_layer_market_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_order ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_customer ON bookings(commerce_layer_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_order_id ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_customer_id ON bookings(commerce_layer_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_market_id ON bookings(commerce_layer_market_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- Update existing bookings to have default values
UPDATE bookings 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Update existing bookings with default values if needed
UPDATE bookings 
SET 
  commerce_layer_market_id = 'vjkaZhNPnl',
  duration_type = 'hour'
WHERE commerce_layer_market_id IS NULL;

-- Create a function to generate booking references
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := 'PK' || LPAD(NEW.id::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate booking references
DROP TRIGGER IF EXISTS trigger_generate_booking_reference ON bookings;
CREATE TRIGGER trigger_generate_booking_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- Add comment for documentation
COMMENT ON COLUMN bookings.sku IS 'SKU of the booked item';
COMMENT ON COLUMN bookings.payment_intent_id IS 'Payment intent ID for tracking';
COMMENT ON COLUMN bookings.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN bookings.commerce_layer_order_id IS 'Commerce Layer order ID for tracking';
COMMENT ON COLUMN bookings.commerce_layer_customer_id IS 'Commerce Layer customer ID';
COMMENT ON COLUMN bookings.commerce_layer_market_id IS 'Commerce Layer market ID (e.g., vjkaZhNPnl)';
COMMENT ON COLUMN bookings.stripe_payment_intent_id IS 'Stripe payment intent ID for payment tracking';
COMMENT ON COLUMN bookings.confirmed_at IS 'Timestamp when booking was confirmed';
COMMENT ON COLUMN bookings.booking_reference IS 'Booking reference number';
COMMENT ON COLUMN bookings.duration_type IS 'Duration type of the booking (e.g., hour, day)';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample of existing data
SELECT id, customer_name, sku, commerce_layer_order_id, status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
