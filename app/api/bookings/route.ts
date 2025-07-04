import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const bookingData = await request.json()

    console.log("📝 Creating booking:", bookingData)

    // TODO: Add user authentication to get real user_id
    const mockUserId = "550e8400-e29b-41d4-a716-446655440003" // Mock user for demo

    // First, check if the space has available capacity
    const { data: spaceData, error: spaceError } = await supabaseServer
      .from("spaces")
      .select("total_spaces, booked_spaces, title")
      .eq("id", bookingData.spaceId)
      .single()

    if (spaceError || !spaceData) {
      console.error("❌ Error fetching space data:", spaceError)
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    const totalSpaces = spaceData.total_spaces || 1
    const bookedSpaces = spaceData.booked_spaces || 0
    const availableSpaces = totalSpaces - bookedSpaces

    if (availableSpaces <= 0) {
      console.log("🚫 Space is fully booked")
      return NextResponse.json(
        {
          error: "This parking space is currently fully booked. Please try another location.",
        },
        { status: 400 },
      )
    }

    // Insert booking into database
    const { data, error } = await supabaseServer
      .from("bookings")
      .insert({
        user_id: mockUserId,
        space_id: bookingData.spaceId,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        total_price: bookingData.totalPrice,
        contact_email: bookingData.contactEmail,
        contact_phone: bookingData.contactPhone,
        special_requests: bookingData.specialRequests,
        status: "confirmed",
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Booking creation error:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Update the booked_spaces count
    const { error: updateError } = await supabaseServer
      .from("spaces")
      .update({ booked_spaces: bookedSpaces + 1 })
      .eq("id", bookingData.spaceId)

    if (updateError) {
      console.error("❌ Error updating booked spaces count:", updateError)
      // Note: In production, you'd want to rollback the booking here
    }

    console.log("✅ Booking created successfully:", data)
    console.log(`📊 Space "${spaceData.title}" now has ${availableSpaces - 1} available spots`)

    // TODO: Send confirmation email
    // TODO: Send notification to space host

    return NextResponse.json({
      success: true,
      booking: data,
      message: "Booking confirmed successfully!",
      remainingSpaces: availableSpaces - 1,
    })
  } catch (error) {
    console.error("💥 Booking API error:", error)
    return NextResponse.json({ error: "Failed to process booking" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let query = supabaseServer
      .from("bookings")
      .select(`
        *,
        space:spaces(*),
        vehicle:vehicles(*)
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Bookings fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("💥 Bookings API error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
