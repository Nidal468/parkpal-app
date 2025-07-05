import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get("space_id")

    if (!spaceId) {
      return NextResponse.json({ error: "space_id parameter is required" }, { status: 400 })
    }

    const { data: reviews, error } = await supabaseServer
      .from("reviews")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    // Calculate average rating
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error("Reviews API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
