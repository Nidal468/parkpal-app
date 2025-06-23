import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verifying real data insertion")

    // Check total spaces
    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*")

    if (allError) {
      return NextResponse.json({
        error: "Database error",
        details: allError,
      })
    }

    // Check hosts
    const { data: hosts, error: hostsError } = await supabaseServer.from("users").select("*")

    // Test SE17 search
    const { data: se17Search, error: se17Error } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .or("location.ilike.%SE17%,location.ilike.%Kennington%,postcode.ilike.%SE17%")

    return NextResponse.json({
      success: true,
      totalSpaces: allSpaces?.length || 0,
      totalHosts: hosts?.length || 0,
      se17Matches: se17Search?.length || 0,

      // Show sample data
      sampleSpaces: allSpaces?.slice(0, 3) || [],
      se17Results: se17Search || [],

      message:
        allSpaces?.length > 0
          ? `✅ Database now has ${allSpaces.length} real parking spaces!`
          : "❌ No spaces found - run the insert script first",

      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Verification error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
