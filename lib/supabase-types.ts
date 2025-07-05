export interface ParkingSpace {
  id: string
  title: string
  description: string
  location: string
  address: string
  postcode: string
  what3words?: string
  price_per_hour: number
  price_per_day: number
  price_per_month: number
  total_spaces: number
  available_spaces: number
  booked_spaces: number
  latitude?: number
  longitude?: number
  features: string
  images?: string[]
  is_available: boolean
  host_id: string
  created_at: string
  updated_at?: string
}

export interface ParkingSpaceDisplay extends Omit<ParkingSpace, "features"> {
  features: string[]
  host?: {
    id: string
    name: string
    email: string
  }
}

export interface SearchParams {
  location?: string
  postcode?: string
  what3words?: string
  maxPrice?: number
  features?: string[]
  startDate?: string
  endDate?: string
}

export interface Review {
  id: string
  space_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
}

export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  registration: string
  color?: string
  vehicle_type: string
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  space_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  vehicle_registration?: string
  vehicle_type: string
  start_time: string
  end_time: string
  total_price: number
  status: string
  commerce_layer_order_id?: string
  commerce_layer_customer_id?: string
  commerce_layer_market_id?: string
  stripe_payment_intent_id?: string
  payment_status?: string
  confirmed_at?: string
  sku?: string
  duration_type?: string
  created_at: string
}

export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
}
