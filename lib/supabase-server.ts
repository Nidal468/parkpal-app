import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

// Create a mock client for build time when environment variables might not be available
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
})

export const supabaseServer =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : (createMockClient() as any)

// Database types
export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
}

export interface ParkingSpace {
  id: string
  title: string
  description: string
  address: string
  price_per_hour: number
  price_per_day: number
  price_per_month: number
  total_spaces: number
  booked_spaces: number
  latitude: number
  longitude: number
  amenities: string[]
  images: string[]
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
