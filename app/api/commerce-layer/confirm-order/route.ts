import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentMethodId } = body

    if (!orderId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get booking details
    const { data: booking, error: fetchError } = await supabase.from("bookings").select("*").eq("id", orderId).single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Confirm payment with Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(booking.payment_intent_id, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/booking/success`,
    })

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment failed" }, { status: 400 })
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Booking update error:", updateError)
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    // Generate booking reference
    const bookingReference = `PK${orderId.toString().padStart(6, "0")}`

    return NextResponse.json({
      success: true,
      bookingId: bookingReference,
      paymentIntentId: paymentIntent.id,
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
