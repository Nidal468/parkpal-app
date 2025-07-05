import { createClient } from "@supabase/supabase-js"

// Make environment variables optional during build
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key"

// Only create real client if environment variables are properly set
export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

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
