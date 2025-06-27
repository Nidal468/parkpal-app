export interface ParkingSpace {
  id: string
  title: string
  description: string
  address: string
  postcode: string
  latitude?: number
  longitude?: number
  price_per_hour?: number
  price_per_day?: number
  price_per_month?: number
  availability: "available" | "occupied" | "reserved"
  space_type: "driveway" | "garage" | "street" | "car_park"
  features?: string[]
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  created_at: string
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

export interface Booking {
  id: string
  space_id: string
  user_id: string
  start_date: string
  end_date: string
  total_price: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  updated_at: string
}
