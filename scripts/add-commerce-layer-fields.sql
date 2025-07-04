-- Add Commerce Layer specific fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS sku VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS commerce_layer_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS commerce_layer_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_order ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_customer ON bookings(commerce_layer_customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

-- Update existing bookings to have default values
UPDATE bookings 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

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
