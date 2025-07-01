-- Update bookings table to support Commerce Layer integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(50),
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_sku ON bookings(sku);

-- Update existing records to have default values
UPDATE bookings 
SET payment_status = 'paid', 
    duration_type = 'hour',
    sku = 'parking-hour'
WHERE payment_status IS NULL;
