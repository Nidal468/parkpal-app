import { NextResponse } from "next/server"
import { searchParkingSpaces } from "@/lib/parking-search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || "parking near me"

    console.log("🔍 Test search query:", query)

    const results = await searchParkingSpaces(query)

    console.log("✅ Test search results:", results.length)

    return NextResponse.json({
      success: true,
      query: query,
      results: results,
      count: results.length,
    })
  } catch (error) {
    console.error("❌ Test search error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
