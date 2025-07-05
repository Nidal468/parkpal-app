-- Create spaces table for parking spaces
CREATE TABLE IF NOT EXISTS spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  description TEXT,
  features TEXT,
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_month DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  available_from DATE,
  available_to DATE,
  available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  available_hours TEXT DEFAULT '00:00-23:59',
  image_url TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  what3words TEXT,
  space_type TEXT,
  access_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_location ON spaces(location);
CREATE INDEX IF NOT EXISTS idx_spaces_postcode ON spaces(postcode);
CREATE INDEX IF NOT EXISTS idx_spaces_is_available ON spaces(is_available);
CREATE INDEX IF NOT EXISTS idx_spaces_price ON spaces(price_per_day);
CREATE INDEX IF NOT EXISTS idx_spaces_coordinates ON spaces(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to available spaces
CREATE POLICY "Public can view available spaces" ON spaces
  FOR SELECT USING (is_available = true);

-- Create policy for hosts to manage their own spaces
CREATE POLICY "Hosts can manage their own spaces" ON spaces
  FOR ALL USING (auth.uid() = host_id);
