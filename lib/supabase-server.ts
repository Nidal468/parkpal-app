import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

// Create a singleton client that handles missing credentials gracefully
let supabaseServerClient: ReturnType<typeof createClient> | null = null

function createSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Supabase credentials not found - creating mock client")
    // Return a mock client for build time
    return {
      from: () => ({
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }) }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          }),
        }),
        update: () => ({
          eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }) }),
        }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }) }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not configured") }),
      },
    } as any
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Initialize the client
if (!supabaseServerClient) {
  supabaseServerClient = createSupabaseServerClient()
}

export const supabaseServer = supabaseServerClient

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
