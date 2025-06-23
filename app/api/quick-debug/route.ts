import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    // Simple check - count total spaces
    const { count: totalCount, error: countError } = await supabaseServer
      .from("spaces")
      .select("*", { count: "exact", head: true })

    if (countError) {
      return NextResponse.json({ error: "Database error", details: countError.message })
    }

    // Get a few sample spaces
    const { data: sampleSpaces, error: sampleError } = await supabaseServer
      .from("spaces")
      .select("title, location, postcode, is_available, price_per_day")
      .limit(5)

    if (sampleError) {
      return NextResponse.json({ error: "Sample query error", details: sampleError.message })
    }

    // Test SE1/SE17 search
    const { data: se1Spaces, error: se1Error } = await supabaseServer
      .from("spaces")
      .select("title, location, postcode, price_per_day")
      .or("postcode.ilike.%SE1%,postcode.ilike.%SE17%,location.ilike.%Kennington%")
      .eq("is_available", true)
      .limit(10)

    return NextResponse.json({
      totalSpaces: totalCount || 0,
      sampleSpaces: sampleSpaces || [],
      se1Spaces: se1Spaces || [],
      hasRealData: (totalCount || 0) > 6,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to debug",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
