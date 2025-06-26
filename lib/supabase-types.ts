// User interface
export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
  updated_at: string
}

// Vehicle interface
export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  color: string
  license_plate: string
  created_at: string
  updated_at: string
}

// Review interface
export interface Review {
  id: string
  space_id: string
  user_id?: string | null
  rating: number
  comment?: string | null
  created_at: string
  updated_at: string
}

// Parking Space interface (updated with inventory tracking and monthly pricing)
export interface ParkingSpace {
  id: string
  title: string
  description?: string
  location?: string
  postcode?: string
  price_per_day?: number
  price_per_month?: number
  latitude?: number
  longitude?: number
  image_url?: string
  available_spaces?: number
  total_spaces?: number
  created_at: string
  updated_at: string
}

// Booking interface (for future implementation)
export interface Booking {
  id: string
  user_id: string
  space_id: string
  vehicle_id?: string
  start_date: string
  end_date: string
  total_price: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}

// Message interface (existing)
export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
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

// Space with reviews and rating summary
export interface SpaceWithReviews extends ParkingSpace {
  reviews: Review[]
  average_rating: number
  total_reviews: number
}

export interface Database {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string
          title: string
          description?: string
          location?: string
          postcode?: string
          price_per_day?: number
          price_per_month?: number
          latitude?: number
          longitude?: number
          image_url?: string
          available_spaces?: number
          total_spaces?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          location?: string
          postcode?: string
          price_per_day?: number
          price_per_month?: number
          latitude?: number
          longitude?: number
          image_url?: string
          available_spaces?: number
          total_spaces?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          postcode?: string
          price_per_day?: number
          price_per_month?: number
          latitude?: number
          longitude?: number
          image_url?: string
          available_spaces?: number
          total_spaces?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          space_id: string
          user_id?: string | null
          rating: number
          comment?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          user_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          role?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          color: string
          license_plate: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          make: string
          model: string
          color: string
          license_plate: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          make?: string
          model?: string
          color?: string
          license_plate?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          space_id: string
          vehicle_id?: string
          start_date: string
          end_date: string
          total_price: number
          status: "pending" | "confirmed" | "cancelled" | "completed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          vehicle_id?: string
          start_date: string
          end_date: string
          total_price: number
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          vehicle_id?: string
          start_date?: string
          end_date?: string
          total_price?: number
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Chat Message interface
export interface ChatMessage {
  id: string
  message: string
  response: string
  created_at: string
}
