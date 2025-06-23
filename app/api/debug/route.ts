import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug API called")

    // Check if spaces table exists and get its structure
    let tableInfo = null
    try {
      const { data: tableCheck, error: tableError } = await supabaseServer
        .from("spaces")
        .select("*")
        .limit(1)
      
      if (tableError) {
        console.error("❌ Table error:", tableError)
        tableInfo = { error: tableError.message, exists: false }
      } else {
        tableInfo = { exists: true, hasData: tableCheck && tableCheck.length > 0 }
      }
    } catch (err) {
      tableInfo = { error: "Table might not exist", exists: false }
    }

    // Check all tables to see what exists
    let allTables = []
    try {
      // Try to get some basic info about available tables
      const { data: messages } = await supabaseServer.from("messages").select("id").limit(1)
      if (messages !== null) allTables.push("messages")
    } catch (e) {
      // messages table doesn't exist
    }

    try {
      const { data: users } = await supabaseServer.from("users").select("id").limit(1)
      if (users !== null) allTables.push("users")
    } catch (e) {
      // users table doesn't exist
    }

    try {
      const { data: vehicles } = await supabaseServer.from("vehicles").select("id").limit(1)
      if (vehicles !== null) allTables.push("vehicles")
    } catch (e) {
      // vehicles table doesn't exist
    }

    try {
      const { data: spaces } = await supabaseServer.from("spaces").select("id").limit(1)
      if (spaces !== null) allTables.push("spaces")
    } catch (e) {
      // spaces table doesn't exist
    }

    // Check what's in messages table (we know this works)
    const { data: messageCount } = await supabaseServer
      .from("messages")
      .select("id", { count: "exact" })
      .limit(0)

    return NextResponse.json({
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      spacesTable: tableInfo,
      existingTables: allTables,
      messagesCount: messageCount?.length || 0,
      envVars: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      },
      { status: 500 },
    )
  }
}
