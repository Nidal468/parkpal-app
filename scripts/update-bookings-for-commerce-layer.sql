-- Add Commerce Layer specific columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'day',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_layer_order_id ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_id ON bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing bookings to have default values
UPDATE bookings 
SET duration_type = 'day', quantity = 1 
WHERE duration_type IS NULL OR quantity IS NULL;
