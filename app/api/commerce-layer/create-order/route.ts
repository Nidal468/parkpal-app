import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, quantity, space, bookingDetails, duration, price } = body

    // Create booking in database first
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: space.id,
        user_email: bookingDetails.customerEmail,
        user_name: bookingDetails.customerName,
        user_phone: bookingDetails.customerPhone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_time: `${bookingDetails.startDate}T${bookingDetails.startTime}:00`,
        end_time: `${bookingDetails.endDate}T${bookingDetails.endTime}:00`,
        total_price: price,
        duration_type: duration,
        quantity: quantity,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Create Stripe Payment Intent
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: "gbp",
      metadata: {
        booking_id: booking.id,
        space_id: space.id,
        sku: sku,
        duration: duration,
      },
    })

    // Update booking with payment intent ID
    await supabase
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", booking.id)

    return NextResponse.json({
      success: true,
      orderId: `order_${booking.id}`,
      bookingId: booking.id,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
