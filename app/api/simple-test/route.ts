import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Simple test API called")

    // Test basic connection
    const { data, error } = await supabaseServer
      .from("spaces")
      .select("id, title, location, postcode, price_per_day, is_available")
      .limit(5)

    if (error) {
      console.error("❌ Query error:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      })
    }

    console.log(`✅ Found ${data?.length || 0} spaces`)

    return NextResponse.json({
      success: true,
      totalFound: data?.length || 0,
      spaces: data || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
