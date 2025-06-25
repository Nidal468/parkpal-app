-- Add latitude and longitude coordinates to existing spaces in SE17 area
-- These are approximate coordinates for SE17 London area

UPDATE spaces 
SET 
  latitude = 51.4948,
  longitude = -0.0877
WHERE postcode LIKE 'SE17%' AND latitude IS NULL;

-- Add more specific coordinates for different SE17 locations
UPDATE spaces 
SET 
  latitude = 51.4955,
  longitude = -0.0885
WHERE title LIKE '%Ambergate%' OR address LIKE '%Ambergate%';

UPDATE spaces 
SET 
  latitude = 51.4940,
  longitude = -0.0870
WHERE title LIKE '%Delverton%' OR address LIKE '%Delverton%';

-- Add coordinates for other SE17 spaces with slight variations
UPDATE spaces 
SET 
  latitude = 51.4945 + (RANDOM() * 0.002 - 0.001),
  longitude = -0.0880 + (RANDOM() * 0.002 - 0.001)
WHERE postcode LIKE 'SE17%' AND latitude IS NULL;
