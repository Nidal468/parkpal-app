import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, quantity, parkingSpaceId, bookingDetails, duration, price } = body

    // Validate required fields
    if (!sku || !parkingSpaceId || !bookingDetails || !duration || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: "usd",
      metadata: {
        sku,
        parkingSpaceId,
        duration,
        customerName: bookingDetails.customerName,
        vehicleReg: bookingDetails.vehicleReg,
      },
    })

    // Store the booking in Supabase (pending payment)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        parking_space_id: parkingSpaceId,
        customer_name: bookingDetails.customerName,
        customer_email: bookingDetails.email,
        customer_phone: bookingDetails.phone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_date: bookingDetails.startDate,
        start_time: bookingDetails.startTime,
        duration_type: duration,
        total_amount: price,
        special_requests: bookingDetails.specialRequests,
        payment_intent_id: paymentIntent.id,
        status: "pending",
        sku: sku,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking record" }, { status: 500 })
    }

    return NextResponse.json({
      orderId: booking.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
