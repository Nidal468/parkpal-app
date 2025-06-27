export interface ParkingSpace {
  id: string
  title: string
  location: string
  address: string
  postcode: string
  price_per_day: number
  price_per_month?: number
  latitude?: number
  longitude?: number
  is_available: boolean
  total_spaces?: number
  booked_spaces?: number
  features?: string[]
  description?: string
  host_id?: string
  created_at?: string
  updated_at?: string
}

export interface Review {
  id: string
  space_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  updated_at?: string
}

export interface Message {
  id: string
  user_message: string
  bot_response: string
  created_at: string
}

export interface Booking {
  id: string
  space_id: string
  user_id: string
  start_date: string
  end_date: string
  total_price: number
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
  updated_at?: string
}
