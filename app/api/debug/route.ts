import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug API called")

    // Check all spaces
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(10)

    if (allError) {
      console.error("❌ Error fetching spaces:", allError)
      return NextResponse.json(
        {
          error: allError.message,
          supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        },
        { status: 500 },
      )
    }

    console.log(`📊 Found ${allSpaces?.length || 0} total spaces`)

    // Test SE17 search
    const { data: se17Spaces, error: searchError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .or("location.ilike.%SE17%,postcode.ilike.%SE17%,address.ilike.%SE17%")

    if (searchError) {
      console.error("❌ SE17 search error:", searchError)
    }

    return NextResponse.json({
      totalSpaces: allSpaces?.length || 0,
      se17Results: se17Spaces?.length || 0,
      allSpaces: allSpaces || [],
      se17Spaces: se17Spaces || [],
      searchError: searchError?.message || null,
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
