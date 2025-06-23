-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  reg TEXT, -- Registration number
  make TEXT,
  model TEXT,
  colour TEXT,
  CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS vehicles_user_id_idx ON vehicles(user_id);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create a policy for vehicles
CREATE POLICY "Users can manage their own vehicles" ON vehicles
  FOR ALL USING (true); -- Adjust this based on your authentication setup
