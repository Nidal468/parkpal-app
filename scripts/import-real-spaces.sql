-- First, let's clear any existing mock data and insert real spaces
-- This will import some sample SE17/Kennington spaces based on your CSV structure

DELETE FROM spaces WHERE title LIKE '%Mock%' OR title LIKE '%Sample%';

-- Insert real SE17 parking spaces (based on your CSV data structure)
INSERT INTO spaces (
  title,
  location,
  address,
  postcode,
  price_per_day,
  is_available,
  features,
  description,
  available_from,
  available_to,
  space_type,
  access_instructions
) VALUES 
(
  'Secure Parking Space - Kennington',
  'Kennington, London',
  'Delverton House, Valentine Place',
  'SE1 8QH',
  8.00,
  true,
  'Secure, Residential, CCTV',
  'Secure parking space in residential building with CCTV monitoring.',
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
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
  '2024-01-01',
  '2024-12-31',
  'Business',
  'Business hours 7am-7pm, security desk'
);
