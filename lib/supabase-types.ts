export interface ParkingSpace {
  id: string
  title: string
  description?: string
  location?: string
  postcode: string
  price_per_day: number
  price_per_month?: number
  total_spaces: number
  available_spaces?: number
  booked_spaces?: number
  features?: string
  image_url?: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
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
  full_name?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  registration: string
  created_at: string
  updated_at: string
}

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

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  created_at: string
}
