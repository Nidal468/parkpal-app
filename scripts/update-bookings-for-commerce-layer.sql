-- Update bookings table to support Commerce Layer integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(10),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing records to have proper status
UPDATE bookings SET status = 'pending' WHERE status IS NULL;
UPDATE bookings SET payment_status = 'pending' WHERE payment_status IS NULL;
