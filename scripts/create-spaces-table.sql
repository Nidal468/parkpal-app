-- Create spaces table to match your existing data structure
CREATE TABLE IF NOT EXISTS spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID,
  title TEXT NOT NULL,
  location TEXT,
  features TEXT, -- Comma-separated features
  is_available BOOLEAN DEFAULT true,
  description TEXT,
  price_per_day DECIMAL(10,2),
  available_from DATE,
  available_to DATE,
  image_url TEXT,
  address TEXT,
  postcode TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  what3words TEXT,
  available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  available_hours TEXT DEFAULT '00:00-23:59',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS spaces_location_idx ON spaces(location);
CREATE INDEX IF NOT EXISTS spaces_postcode_idx ON spaces(postcode);
CREATE INDEX IF NOT EXISTS spaces_available_idx ON spaces(is_available);
CREATE INDEX IF NOT EXISTS spaces_price_idx ON spaces(price_per_day);
CREATE INDEX IF NOT EXISTS spaces_dates_idx ON spaces(available_from, available_to);

-- Enable Row Level Security
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Create a policy for spaces (adjust as needed)
CREATE POLICY "Allow all operations on spaces" ON spaces
  FOR ALL USING (true);
