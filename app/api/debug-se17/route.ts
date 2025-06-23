import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug SE17 search")

    // First, check if we have any spaces at all
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(10)

    if (allError) {
      return NextResponse.json({
        error: "Database error",
        details: allError,
        step: "checking all spaces",
      })
    }

    console.log(`Found ${allSpaces?.length || 0} total spaces`)

    // Check specifically for SE17 related spaces
    const { data: se17Spaces, error: se17Error } = await supabaseServer
      .from("spaces")
      .select("*")
      .or("location.ilike.%SE17%,address.ilike.%SE17%,postcode.ilike.%SE17%,location.ilike.%Kennington%")

    if (se17Error) {
      return NextResponse.json({
        error: "SE17 search error",
        details: se17Error,
        step: "searching SE17",
      })
    }

    // Check available spaces
    const { data: availableSpaces, error: availError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)

    if (availError) {
      return NextResponse.json({
        error: "Available search error",
        details: availError,
        step: "checking available",
      })
    }

    // Test the exact search logic from chat
    const { data: chatSearch, error: chatError } = await supabaseServer
      .from("spaces")
      .select("*")
      .or('is_available.eq.true,is_available.eq."true"')
      .or("title.ilike.%SE17%,location.ilike.%SE17%,address.ilike.%SE17%,postcode.ilike.%SE17%")
      .order("price_per_day", { ascending: true })
      .limit(6)

    if (chatError) {
      return NextResponse.json({
        error: "Chat search error",
        details: chatError,
        step: "chat search logic",
      })
    }

    return NextResponse.json({
      success: true,
      totalSpaces: allSpaces?.length || 0,
      se17Spaces: se17Spaces?.length || 0,
      availableSpaces: availableSpaces?.length || 0,
      chatSearchResults: chatSearch?.length || 0,
      allSpaces: allSpaces?.slice(0, 3) || [],
      se17Results: se17Spaces || [],
      availableResults: availableSpaces?.slice(0, 3) || [],
      chatResults: chatSearch || [],
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
