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
    const { sku, quantity, price, parkingSpace, bookingDetails, duration } = body

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: "usd",
      metadata: {
        sku,
        parking_space_id: parkingSpace.id,
        duration,
        customer_name: bookingDetails.customerName,
        vehicle_reg: bookingDetails.vehicleReg,
      },
    })

    // Create booking record in Supabase
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: parkingSpace.id,
        customer_name: bookingDetails.customerName,
        customer_email: bookingDetails.email,
        customer_phone: bookingDetails.phone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_date: bookingDetails.startDate,
        start_time: bookingDetails.startTime,
        duration_type: duration,
        total_price: price,
        payment_intent_id: paymentIntent.id,
        commerce_layer_sku: sku,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
