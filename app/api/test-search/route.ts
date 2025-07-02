import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Test search endpoint called")

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: "Supabase not configured",
        details: "Missing environment variables",
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
    }

    // Test database connection
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("🔍 Testing database connection...")

    const { data: spaces, error } = await supabase.from("spaces").select("*").limit(5)

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({
        error: "Database query failed",
        details: error.message,
        code: error.code,
      })
    }

    console.log("✅ Found spaces:", spaces?.length || 0)

    return NextResponse.json({
      success: true,
      spacesFound: spaces?.length || 0,
      spaces: spaces || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Test search error:", error)
    return NextResponse.json(
      {
        error: "Test search failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
