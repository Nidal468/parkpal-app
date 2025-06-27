import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables")
  throw new Error("Missing Supabase environment variables")
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey)
