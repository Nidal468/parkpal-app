export interface ParkingSpace {
  id: string
  title: string
  location?: string
  postcode: string
  price_per_day: number
  price_per_month?: number
  available_spaces?: number
  total_spaces: number
  booked_spaces?: number
  features?: string
  image_url?: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export interface ParkingSpaceDisplay {
  id: string
  title: string
  location: string
  price_per_hour: number
  price_per_day: number
  price_per_month: number
  latitude: number
  longitude: number
  image_url?: string
  description?: string
  features?: string[]
  availability?: boolean
  rating?: number
  reviews_count?: number
}

export interface Review {
  id: string
  space_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  created_at: string
  user_id: string
  reg: string | null
  make: string | null
  model: string | null
  colour: string | null
}

export interface Booking {
  id: string
  space_id: string
  user_email: string
  start_date: string
  end_date: string
  total_price: number
  status: "pending" | "confirmed" | "cancelled"
  vehicle_registration: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  created_at: string
}
