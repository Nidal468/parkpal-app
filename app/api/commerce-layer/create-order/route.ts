import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, quantity, price, bookingDetails, spaceId } = body

    // Validate required fields
    if (!sku || !quantity || !price || !bookingDetails || !spaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate total amount in pence for Stripe
    const totalAmount = Math.round(price * quantity * 100)

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      metadata: {
        sku,
        quantity: quantity.toString(),
        space_id: spaceId,
        customer_name: bookingDetails.customerName,
        customer_email: bookingDetails.customerEmail,
        vehicle_reg: bookingDetails.vehicleReg,
      },
    })

    // Create booking record in Supabase
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        customer_name: bookingDetails.customerName,
        customer_email: bookingDetails.customerEmail,
        customer_phone: bookingDetails.customerPhone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_date: bookingDetails.startDate,
        start_time: bookingDetails.startTime,
        duration_type: sku.replace("parking-", ""), // Extract duration from SKU
        duration_quantity: quantity,
        total_price: price * quantity,
        payment_intent_id: paymentIntent.id,
        status: "pending",
        notes: bookingDetails.notes || null,
        commerce_layer_sku: sku,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return NextResponse.json({ error: "Failed to create booking record" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
