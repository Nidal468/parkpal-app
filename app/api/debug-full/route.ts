import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Full Debug API called")

    // Check Supabase configuration
    const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    console.log("🔧 Supabase configured:", supabaseConfigured)

    if (!supabaseConfigured) {
      return NextResponse.json({
        error: "Supabase not configured",
        supabaseConfigured: false,
      })
    }

    // Test connection and get all spaces
    const { data: allSpaces, error: allError } = await supabaseServer
      .from("spaces")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (allError) {
      console.error("❌ Error fetching spaces:", allError)
      return NextResponse.json({
        error: allError.message,
        supabaseConfigured: true,
        tableExists: false,
        errorDetails: allError,
      })
    }

    console.log(`📊 Found ${allSpaces?.length || 0} total spaces`)

    // Test the exact search logic from the chat route
    let searchQuery = supabaseServer.from("spaces").select("*")

    // Test is_available filtering (the main issue)
    searchQuery = searchQuery.or('is_available.eq.true,is_available.eq."true"')

    const { data: availableSpaces, error: availableError } = await searchQuery.limit(10)

    if (availableError) {
      console.error("❌ Available spaces query error:", availableError)
    }

    // Test SE17/Kennington search
    const { data: kenningtonSpaces, error: kenningtonError } = await supabaseServer
      .from("spaces")
      .select("*")
      .or('is_available.eq.true,is_available.eq."true"')
      .or("title.ilike.%Kennington%,location.ilike.%Kennington%,address.ilike.%Kennington%,postcode.ilike.%SE17%")
      .limit(5)

    if (kenningtonError) {
      console.error("❌ Kennington search error:", kenningtonError)
    }

    // Analyze the data structure
    const sampleSpace = allSpaces?.[0]
    const dataAnalysis = {
      totalSpaces: allSpaces?.length || 0,
      availableSpaces: availableSpaces?.length || 0,
      kenningtonSpaces: kenningtonSpaces?.length || 0,
      hasRealData: (allSpaces?.length || 0) > 6, // More than mock data
      sampleSpaceStructure: sampleSpace
        ? {
            id: sampleSpace.id,
            title: sampleSpace.title,
            location: sampleSpace.location,
            postcode: sampleSpace.postcode,
            is_available: sampleSpace.is_available,
            is_available_type: typeof sampleSpace.is_available,
            price_per_day: sampleSpace.price_per_day,
            features: sampleSpace.features,
            created_at: sampleSpace.created_at,
          }
        : null,
    }

    // Log each space for debugging
    console.log("📋 All spaces:")
    allSpaces?.forEach((space, index) => {
      console.log(`${index + 1}. ${space.title} - ${space.location} (${space.postcode})`)
      console.log(`   Available: ${space.is_available} (${typeof space.is_available})`)
      console.log(`   Price: £${space.price_per_day}`)
    })

    return NextResponse.json({
      supabaseConfigured: true,
      tableExists: true,
      dataAnalysis,
      allSpaces: allSpaces || [],
      availableSpaces: availableSpaces || [],
      kenningtonSpaces: kenningtonSpaces || [],
      debugInfo: {
        timestamp: new Date().toISOString(),
        searchLogic: "Testing is_available filtering and location search",
        possibleIssues: [
          allSpaces?.length === 0 ? "No data in spaces table" : null,
          availableSpaces?.length === 0 ? "is_available filtering issue" : null,
          kenningtonSpaces?.length === 0 ? "Location search not finding matches" : null,
        ].filter(Boolean),
      },
    })
  } catch (error) {
    console.error("❌ Full debug error:", error)
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
