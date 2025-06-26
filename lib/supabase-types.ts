export interface ParkingSpace {
  id: string
  title: string
  description?: string
  location?: string
  address?: string
  postcode?: string
  price_per_day: number
  price_per_month?: number
  total_spaces?: number
  booked_spaces?: number
  available_spaces?: number
  is_available: boolean
  features?: string
  image_url?: string
  host_id?: string
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

export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
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
