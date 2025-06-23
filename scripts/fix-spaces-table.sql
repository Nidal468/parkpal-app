-- First, let's check if the spaces table exists and what columns it has
-- If it doesn't exist, create it with the correct structure

-- Drop and recreate the spaces table with the correct structure
DROP TABLE IF EXISTS spaces CASCADE;

CREATE TABLE spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID DEFAULT 'csv-import-host',
  title TEXT NOT NULL,
  location TEXT,
  address TEXT,
  postcode TEXT,
  price_per_day DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  features TEXT,
  description TEXT,
  available_from DATE DEFAULT '2024-01-01',
  available_to DATE DEFAULT '2024-12-31',
  space_type TEXT,
  access_instructions TEXT,
  image_url TEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  what3words TEXT,
  available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  available_hours TEXT DEFAULT '00:00-23:59',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS spaces_location_idx ON spaces(location);
CREATE INDEX IF NOT EXISTS spaces_postcode_idx ON spaces(postcode);
CREATE INDEX IF NOT EXISTS spaces_available_idx ON spaces(is_available);
CREATE INDEX IF NOT EXISTS spaces_price_idx ON spaces(price_per_day);

-- Enable Row Level Security
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust as needed)
CREATE POLICY "Allow all operations on spaces" ON spaces FOR ALL USING (true);

-- Insert some real SE1/SE17 parking spaces
INSERT INTO spaces (
  title,
  location,
  address,
  postcode,
  price_per_day,
  is_available,
  features,
  description,
  space_type,
  access_instructions
) VALUES 
(
  'Secure Parking - Kennington',
  'Kennington, London',
  'Delverton House, Valentine Place',
  'SE1 8QH',
  8.00,
  true,
  'Secure, Residential, CCTV',
  'Secure parking space in residential building with CCTV monitoring.',
  'Residential',
  'Access via main entrance, space number will be provided'
),
(
  'Private Driveway - Elephant & Castle',
  'Elephant & Castle, London', 
  'Strata Tower, Walworth Road',
  'SE1 6EL',
  12.00,
  true,
  'Private, Secure, Easy Access',
  'Private driveway space near Elephant & Castle station.',
  'Private',
  'Direct access from main road'
),
(
  'Underground Parking - Borough',
  'Borough, London',
  'The Shard, London Bridge Street',
  'SE1 9SG',
  25.00,
  true,
  'Underground, 24/7 Security, Electric Charging',
  'Premium underground parking with electric vehicle charging points.',
  'Underground',
  'Enter via London Bridge Street entrance'
),
(
  'Street Parking - Bermondsey',
  'Bermondsey, London',
  'Tooley Street',
  'SE1 2TH',
  6.00,
  true,
  'Street Level, Pay & Display',
  'Convenient street parking near London Bridge.',
  'Street',
  'Standard pay and display parking'
),
(
  'Covered Bay - Southwark',
  'Southwark, London',
  'Union Street',
  'SE1 1SZ',
  15.00,
  true,
  'Covered, Weather Protected',
  'Weather-protected parking bay in central Southwark.',
  'Covered',
  'Covered parking area, space 12'
),
(
  'Residential Parking - Kennington Road',
  'Kennington, London',
  '123 Kennington Road',
  'SE17 1AB',
  10.00,
  true,
  'Residential, Quiet Area, CCTV',
  'Quiet residential parking space with CCTV security.',
  'Residential',
  'Resident parking area, buzz flat 12'
),
(
  'Business Parking - Waterloo',
  'Waterloo, London',
  'Westminster Bridge Road',
  'SE1 7PB',
  18.00,
  true,
  'Business Hours, Secure, Central',
  'Business district parking near Waterloo station.',
  'Business',
  'Business hours 7am-7pm, security desk'
),
(
  'Budget Parking - Old Kent Road',
  'Old Kent Road, London',
  '456 Old Kent Road',
  'SE1 5BA',
  5.00,
  true,
  'Budget Friendly, Open Air',
  'Affordable parking option on Old Kent Road.',
  'Street',
  'Street parking, pay via app'
),
(
  'Premium Garage - London Bridge',
  'London Bridge, London',
  'London Bridge Station',
  'SE1 9SP',
  30.00,
  true,
  'Premium, Valet Service, Indoor',
  'Premium parking with valet service near London Bridge.',
  'Premium',
  'Valet service available 24/7'
),
(
  'Community Parking - Peckham',
  'Peckham, London',
  'Rye Lane',
  'SE15 4ST',
  7.00,
  true,
  'Community, Local Area',
  'Community parking space in vibrant Peckham area.',
  'Community',
  'Community parking, local residents welcome'
);
