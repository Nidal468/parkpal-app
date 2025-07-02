import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    console.log("📋 Fetching bookings...")

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase not configured")
      return NextResponse.json(
        {
          error: "Database not configured",
          details: "Missing Supabase environment variables",
        },
        { status: 500 },
      )
    }

    const { data: bookings, error } = await supabaseServer
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch bookings",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Bookings fetched successfully:", bookings?.length || 0)
    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0,
    })
  } catch (error) {
    console.error("❌ Bookings API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("📋 Creating booking:", body)

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase not configured")
      return NextResponse.json(
        {
          error: "Database not configured",
          details: "Missing Supabase environment variables",
        },
        { status: 500 },
      )
    }

    const { data: booking, error } = await supabaseServer.from("bookings").insert(body).select().single()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          error: "Failed to create booking",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Booking created successfully:", booking.id)
    return NextResponse.json({
      success: true,
      booking: booking,
    })
  } catch (error) {
    console.error("❌ Create booking error:", error)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
