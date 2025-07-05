import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const { data: bookings, error } = await supabaseServer
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching bookings:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Bookings GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      space_id,
      customer_name,
      customer_email,
      customer_phone,
      vehicle_registration,
      start_time,
      end_time,
      total_price,
    } = body

    // Validate required fields
    if (!space_id || !customer_name || !customer_email || !vehicle_registration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert booking
    const { data: booking, error } = await supabaseServer
      .from("bookings")
      .insert({
        space_id,
        customer_name,
        customer_email,
        customer_phone,
        vehicle_registration,
        start_time,
        end_time,
        total_price,
        status: "confirmed",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking created successfully",
    })
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
