-- Update bookings table to support Commerce Layer integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS duration_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_commerce_sku ON bookings(commerce_layer_sku);

-- Update existing records to have default values
UPDATE bookings 
SET duration_type = 'day', 
    duration_quantity = 1,
    payment_confirmed = (status = 'confirmed')
WHERE duration_type IS NULL;
