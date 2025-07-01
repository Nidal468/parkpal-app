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
    const { sku, quantity, parkingSpace, bookingDetails, duration, rate } = body

    // Validate required fields
    if (!sku || !parkingSpace || !bookingDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(rate * 100), // Convert to cents
      currency: "usd",
      metadata: {
        sku,
        parkingSpaceId: parkingSpace.id,
        duration,
        customerName: bookingDetails.customerName,
        vehicleReg: bookingDetails.vehicleReg,
      },
    })

    // Store preliminary booking data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: "temp-user", // In real app, get from auth
        space_id: parkingSpace.id,
        start_time: `${bookingDetails.startDate}T${bookingDetails.startTime}:00`,
        end_time: calculateEndTime(bookingDetails.startDate, bookingDetails.startTime, duration),
        total_price: rate,
        status: "pending",
        customer_name: bookingDetails.customerName,
        customer_email: bookingDetails.email,
        customer_phone: bookingDetails.phone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        special_requests: bookingDetails.specialRequests,
        payment_intent_id: paymentIntent.id,
        sku: sku,
        duration_type: duration,
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

function calculateEndTime(startDate: string, startTime: string, duration: string): string {
  const start = new Date(`${startDate}T${startTime}:00`)

  switch (duration) {
    case "hour":
      start.setHours(start.getHours() + 1)
      break
    case "day":
      start.setDate(start.getDate() + 1)
      break
    case "month":
      start.setMonth(start.getMonth() + 1)
      break
    default:
      start.setHours(start.getHours() + 1)
  }

  return start.toISOString()
}
