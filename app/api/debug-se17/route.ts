import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug SE17 search - checking REAL database data")

    // First, check if we have any spaces at all
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(10)

    if (allError) {
      return NextResponse.json({
        error: "Database error",
        details: allError,
        step: "checking all spaces",
      })
    }

    console.log(`Found ${allSpaces?.length || 0} total spaces in database`)

    // Check specifically for SE17 related spaces
    const { data: se17Spaces, error: se17Error } = await supabaseServer
      .from("spaces")
      .select("*")
      .or("location.ilike.%SE17%,address.ilike.%SE17%,postcode.ilike.%SE17%,location.ilike.%Kennington%")

    // Check available spaces
    const { data: availableSpaces, error: availError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)

    // Test the exact search logic from chat
    const { data: chatSearch, error: chatError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .or(
        "location.ilike.%SE17%,location.ilike.%SE1%,location.ilike.%Kennington%,location.ilike.%Elephant%,location.ilike.%Borough%,location.ilike.%Southwark%,postcode.ilike.%SE1%,address.ilike.%SE1%",
      )
      .order("price_per_day", { ascending: true })
      .limit(6)

    return NextResponse.json({
      success: true,
      totalSpaces: allSpaces?.length || 0,
      se17Spaces: se17Spaces?.length || 0,
      availableSpaces: availableSpaces?.length || 0,
      chatSearchResults: chatSearch?.length || 0,

      // Show actual data
      sampleSpaces: allSpaces?.slice(0, 5) || [],
      se17Results: se17Spaces || [],
      availableResults: availableSpaces?.slice(0, 5) || [],
      chatResults: chatSearch || [],

      // Show table structure
      tableStructure: allSpaces?.[0] ? Object.keys(allSpaces[0]) : [],

      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
