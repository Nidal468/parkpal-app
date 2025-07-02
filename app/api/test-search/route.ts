import { NextResponse } from "next/server"
import { searchParkingSpaces } from "@/lib/parking-search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const location = searchParams.get("location") || ""

    console.log("🔍 Search request:", { query, location })

    const results = await searchParkingSpaces(query, location)

    console.log("✅ Search results:", results.length, "spaces found")

    return NextResponse.json({
      success: true,
      query,
      location,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error("❌ Search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
