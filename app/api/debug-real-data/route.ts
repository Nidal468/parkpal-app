import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Real Data API called")

    // Test direct query to spaces table
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(10)

    if (allError) {
      console.error("❌ Error fetching spaces:", allError)
      return NextResponse.json({
        error: allError.message,
        supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        tableExists: false,
      })
    }

    console.log(`📊 Found ${allSpaces?.length || 0} total spaces`)

    // Test SE17 search specifically
    const { data: se17Spaces, error: se17Error } = await supabaseServer
      .from("spaces")
      .select("*")
      .or("postcode.ilike.%SE17%,location.ilike.%SE17%,address.ilike.%SE17%")
      .limit(5)

    if (se17Error) {
      console.error("❌ SE17 search error:", se17Error)
    }

    console.log(`🎯 Found ${se17Spaces?.length || 0} SE17 spaces`)

    // Log details of each space
    allSpaces?.forEach((space, index) => {
      console.log(`Space ${index + 1}:`)
      console.log(`  - ID: ${space.id}`)
      console.log(`  - Title: ${space.title}`)
      console.log(`  - Location: ${space.location}`)
      console.log(`  - Postcode: ${space.postcode}`)
      console.log(`  - Available: ${space.is_available} (type: ${typeof space.is_available})`)
      console.log(`  - Price: £${space.price_per_day}`)
      console.log("")
    })

    return NextResponse.json({
      totalSpaces: allSpaces?.length || 0,
      se17Spaces: se17Spaces?.length || 0,
      allSpaces: allSpaces || [],
      se17Results: se17Spaces || [],
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      tableExists: true,
      debugInfo: {
        hasRealData: (allSpaces?.length || 0) > 6, // More than our 6 mock spaces
        sampleSpace: allSpaces?.[0] || null,
      },
    })
  } catch (error) {
    console.error("❌ Debug real data error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
