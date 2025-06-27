import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { space_id, user_email, start_date, end_date, vehicle_registration, total_price } = body

    console.log("Creating booking:", { space_id, user_email, start_date, end_date })

    const { data: booking, error } = await supabaseServer
      .from("bookings")
      .insert([
        {
          space_id,
          user_email,
          start_date,
          end_date,
          vehicle_registration,
          total_price,
          status: "confirmed",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("Booking created successfully:", booking.id)

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("user_email")

    if (!userEmail) {
      return NextResponse.json({ error: "user_email is required" }, { status: 400 })
    }

    const { data: bookings, error } = await supabaseServer
      .from("bookings")
      .select("*, spaces(*)")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [] })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
