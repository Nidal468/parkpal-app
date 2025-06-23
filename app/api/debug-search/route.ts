import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testQuery = searchParams.get("q") || "se17"

    console.log("🔍 Debug Search API called with query:", testQuery)

    // First, let's see ALL spaces in the database
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(10)

    if (allError) {
      console.error("❌ Error fetching all spaces:", allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    console.log(`📊 Total spaces in database: ${allSpaces?.length || 0}`)

    // Log each space for debugging
    allSpaces?.forEach((space, index) => {
      console.log(`Space ${index + 1}:`)
      console.log(`  - ID: ${space.id}`)
      console.log(`  - Title: ${space.title}`)
      console.log(`  - Location: ${space.location}`)
      console.log(`  - Postcode: ${space.postcode}`)
      console.log(`  - Available: ${space.is_available}`)
      console.log(`  - Address: ${space.address}`)
      console.log("")
    })

    // Now test the search query
    const locationTerm = `%${testQuery}%`
    const { data: searchResults, error: searchError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .or(
        `title.ilike.${locationTerm},location.ilike.${locationTerm},address.ilike.${locationTerm},postcode.ilike.${locationTerm}`,
      )
      .limit(5)

    if (searchError) {
      console.error("❌ Search error:", searchError)
      return NextResponse.json({ error: searchError.message }, { status: 500 })
    }

    console.log(`🎯 Search results for "${testQuery}": ${searchResults?.length || 0} found`)

    return NextResponse.json({
      query: testQuery,
      totalSpaces: allSpaces?.length || 0,
      searchResults: searchResults?.length || 0,
      allSpaces: allSpaces || [],
      foundSpaces: searchResults || [],
      debugInfo: {
        searchQuery: `title.ilike.${locationTerm},location.ilike.${locationTerm},address.ilike.${locationTerm},postcode.ilike.${locationTerm}`,
        isSupabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      },
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json({ error: "Debug search failed" }, { status: 500 })
  }
}
