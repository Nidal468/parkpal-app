import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get("space_id")

    if (!spaceId) {
      return NextResponse.json({ error: "space_id is required" }, { status: 400 })
    }

    console.log("🔍 Fetching reviews for space:", spaceId)

    const { data: reviews, error } = await supabaseServer
      .from("reviews")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching reviews:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    console.log(`✅ Found ${reviews?.length || 0} reviews`)

    return NextResponse.json({
      reviews: reviews || [],
      count: reviews?.length || 0,
    })
  } catch (error) {
    console.error("💥 Reviews API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
