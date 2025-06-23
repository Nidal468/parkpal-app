-- Add columns to track bookings and availability
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS total_spaces INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS booked_spaces INTEGER DEFAULT 0;

-- Update existing spaces to have default values
UPDATE spaces 
SET total_spaces = 1, booked_spaces = 0 
WHERE total_spaces IS NULL OR booked_spaces IS NULL;

-- Add a computed column for available spaces
-- This will be calculated: total_spaces - booked_spaces
