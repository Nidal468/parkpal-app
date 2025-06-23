import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    console.log("📝 Creating booking:", bookingData)

    // TODO: Add user authentication to get real user_id
    const mockUserId = "550e8400-e29b-41d4-a716-446655440003" // Mock user for demo

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

    console.log("✅ Booking created successfully:", data)

    // TODO: Send confirmation email
    // TODO: Send notification to space host

    return NextResponse.json({
      success: true,
      booking: data,
      message: "Booking confirmed successfully!",
    })
  } catch (error) {
    console.error("💥 Booking API error:", error)
    return NextResponse.json({ error: "Failed to process booking" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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
