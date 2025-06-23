// User interface
export interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  created_at: string | null
}

// Vehicle interface
export interface Vehicle {
  id: string
  created_at: string
  user_id: string
  reg: string | null // Registration number
  make: string | null
  model: string | null
  colour: string | null
}

// Parking Space interface (updated with inventory tracking and monthly pricing)
export interface ParkingSpace {
  id: string
  host_id: string
  title: string
  location: string
  features: string // Stored as comma-separated string in DB
  is_available: boolean | null
  description: string | null
  price_per_day: number | null
  price_per_month: number | null // Monthly pricing
  available_from: string | null // date string
  available_to: string | null // date string
  image_url: string | null
  address: string | null
  postcode: string | null
  latitude: number | null
  longitude: number | null
  what3words: string | null
  available_days: string | null // Default: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
  available_hours: string | null // Default: '00:00-23:59'
  total_spaces: number | null // Total parking spaces available
  booked_spaces: number | null // Currently booked spaces
}

// Booking interface (for future implementation)
export interface Booking {
  id: string
  user_id: string
  space_id: string
  vehicle_id: string | null
  start_date: string
  end_date: string
  total_price: number | null
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}

// Message interface (existing)
export interface Message {
  id: string
  user_message: string
  bot_response: string | null
  created_at: string | null
}

// Chat Session interface (existing)
export interface ChatSession {
  id: string
  user_id: string
  prompt: string
  response: string
  created_at: string
}

// Helper type for frontend display (with parsed features and host info)
export interface ParkingSpaceDisplay extends Omit<ParkingSpace, "features"> {
  features: string[] // Parsed from comma-separated string
  host?: User // Optional host information
  available_spaces?: number // Calculated: total_spaces - booked_spaces
}

// Enhanced search parameters
export interface SearchParams {
  location?: string
  startDate?: string
  endDate?: string
  maxPrice?: number
  postcode?: string
  what3words?: string
  features?: string[]
  userId?: string // For user-specific searches
}

// User profile with vehicles
export interface UserProfile extends User {
  vehicles: Vehicle[]
}

// Space with host information
export interface SpaceWithHost extends ParkingSpace {
  host: User
}
