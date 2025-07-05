-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'john.host@example.com', 'John Smith', 'host'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sarah.host@example.com', 'Sarah Johnson', 'host'),
  ('550e8400-e29b-41d4-a716-446655440003', 'mike.parker@example.com', 'Mike Parker', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles (id, user_id, reg, make, model, colour) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'AB12 CDE', 'Toyota', 'Camry', 'Blue'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'XY98 ZAB', 'Honda', 'Civic', 'Red')
ON CONFLICT (id) DO NOTHING;

-- Insert sample parking spaces
INSERT INTO spaces (id, host_id, title, location, features, description, price_per_day, available_from, available_to, address, postcode, latitude, longitude, what3words) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Secure Underground Parking', 'Kennington', '24/7 Security,CCTV,Underground,Electric Charging', 'Safe underground parking with 24/7 security and CCTV monitoring. Perfect for long-term stays.', 15, '2024-01-01', '2024-12-31', '123 Kennington Road', 'SE17 1AB', 51.4875, -0.1097, '///parks.secure.underground'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Kennington Road Parking', 'Kennington', 'Near Tube,Street Level,Pay & Display', 'Convenient street-level parking near Kennington tube station. Easy access to central London.', 12, '2024-01-01', '2024-12-31', '456 Kennington Road', 'SE17 2CD', 51.4889, -0.1063, '///street.level.parking'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Covered Parking Bay', 'Kennington', 'Covered,Residential,Quiet Area', 'Weather-protected parking space in a residential area. Quiet and secure location.', 18, '2024-01-01', '2024-12-31', '789 Kennington Park Road', 'SE17 3EF', 51.4901, -0.1089, '///covered.quiet.residential'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Budget Parking Space', 'Elephant & Castle', 'Budget Friendly,Transport Links,Open Air', 'Affordable parking option near Elephant & Castle. Good transport links to central London.', 8, '2024-01-01', '2024-12-31', '321 New Kent Road', 'SE1 4GH', 51.4946, -0.0999, '///budget.transport.links'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Premium Parking Garage', 'Vauxhall', 'Valet Service,Car Wash,Premium,Indoor', 'High-end parking facility with valet service and car wash options. Premium location.', 25, '2024-01-01', '2024-12-31', '654 Vauxhall Bridge Road', 'SE11 5IJ', 51.4857, -0.124, '///premium.valet.service'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Waterloo Station Parking', 'Waterloo', 'Near Station,Commuter Friendly,Central Location', 'Convenient parking near Waterloo station. Perfect for commuters and visitors to central London.', 20, '2024-01-01', '2024-12-31', '987 Waterloo Road', 'SE1 8KL', 51.5045, -0.1097, '///station.commuter.central')
ON CONFLICT (id) DO NOTHING;

-- Insert sample parking spaces (only if none exist)
INSERT INTO spaces (
  title, location, address, postcode, description, features, 
  price_per_day, price_per_month, is_available, latitude, longitude
) 
SELECT * FROM (VALUES
  ('Secure Parking - London Bridge', 'London Bridge, London', 'London Bridge Street', 'SE1 9RT', 
   'Secure underground parking near London Bridge station', 'Underground,Secure,24/7 Access', 
   25.00, 650.00, true, 51.5045, -0.0865),
  ('Private Driveway - Elephant & Castle', 'Elephant & Castle, London', 'New Kent Road', 'SE17 1LB', 
   'Private driveway space near Elephant & Castle', 'Private,Easy Access,CCTV', 
   18.50, 480.00, true, 51.4948, -0.0877),
  ('Business Parking - Canary Wharf', 'Canary Wharf, London', 'Canada Square', 'E14 5AB', 
   'Premium business district parking', 'Business Hours,Secure,Electric Charging', 
   45.00, 1200.00, true, 51.5054, -0.0235)
) AS sample_data
WHERE NOT EXISTS (SELECT 1 FROM spaces LIMIT 1);
