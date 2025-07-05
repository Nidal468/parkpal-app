import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { data, error } = await supabaseServer.from("bookings").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json({ bookings: data })
  } catch (error) {
    console.error("Bookings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const bookingData = await request.json()

    const { data, error } = await supabaseServer.from("bookings").insert([bookingData]).select()

    if (error) {
      console.error("Error creating booking:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({ booking: data[0] }, { status: 201 })
  } catch (error) {
    console.error("Booking creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
