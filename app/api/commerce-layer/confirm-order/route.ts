import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Use environment variables with fallback for build time
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
    }

    const body = await request.json()
    const { orderId, paymentMethodId } = body

    if (!orderId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing orderId or paymentMethodId" }, { status: 400 })
    }

    // Get the booking from Supabase
    const { data: booking, error: fetchError } = await supabase.from("bookings").select("*").eq("id", orderId).single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateError) {
      console.error("Booking update error:", updateError)
      return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bookingId: `PK-${orderId.toString().padStart(6, "0")}`,
      paymentIntentId: booking.payment_intent_id,
    })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
