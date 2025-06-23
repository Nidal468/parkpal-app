-- Add price_per_month column to spaces table if it doesn't exist
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10,2);

-- Update existing spaces with sample monthly pricing (roughly 25x daily rate for monthly discount)
UPDATE spaces 
SET price_per_month = CASE 
  WHEN price_per_day IS NOT NULL THEN price_per_day * 25
  ELSE 200.00
END
WHERE price_per_month IS NULL;

-- Add some comments for clarity
COMMENT ON COLUMN spaces.price_per_month IS 'Monthly rental price for the parking space';
