import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
}
