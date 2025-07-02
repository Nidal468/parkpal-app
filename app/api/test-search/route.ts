import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    console.log("🔍 Testing parking space search...")

    const { data, error } = await supabaseServer.from("parking_spaces").select("*").limit(5)

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("✅ Found parking spaces:", data?.length || 0)

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      spaces: data || [],
      message: data?.length ? "Parking spaces found" : "No parking spaces in database",
    })
  } catch (error) {
    console.error("❌ API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
