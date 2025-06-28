import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get("space_id")

    console.log("🔍 Reviews API called for space:", spaceId)

    if (!spaceId) {
      return NextResponse.json({ error: "space_id is required" }, { status: 400 })
    }

    // First check if reviews table exists
    const { data: reviews, error } = await supabaseServer
      .from("reviews")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })

    console.log("📊 Reviews query result:", { reviews, error })

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate average rating
    let averageRating = 0
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      averageRating = totalRating / reviews.length
    }

    return NextResponse.json({
      reviews: reviews || [],
      averageRating,
      totalReviews: reviews?.length || 0,
    })
  } catch (error) {
    console.error("❌ Reviews API error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
