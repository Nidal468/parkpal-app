import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Payment processing not configured" }, { status: 500 })
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Dynamic imports to avoid build-time initialization
    const Stripe = (await import("stripe")).default
    const { createClient } = await import("@supabase/supabase-js")

    // Initialize clients at runtime
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    })

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await request.json()
    const { sku, quantity, parkingSpace, bookingDetails, duration, rate } = body

    // Validate required fields
    if (!sku || !parkingSpace || !bookingDetails || !rate) {
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

    // Calculate end time
    const startDateTime = new Date(`${bookingDetails.startDate}T${bookingDetails.startTime}:00`)
    const endDateTime = new Date(startDateTime)

    switch (duration) {
      case "hour":
        endDateTime.setHours(endDateTime.getHours() + 1)
        break
      case "day":
        endDateTime.setDate(endDateTime.getDate() + 1)
        break
      case "month":
        endDateTime.setMonth(endDateTime.getMonth() + 1)
        break
      default:
        endDateTime.setHours(endDateTime.getHours() + 1)
    }

    // Store preliminary booking data
    const bookingData = {
      user_id: "temp-user", // In real app, get from auth
      space_id: parkingSpace.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      total_price: rate,
      status: "pending",
      customer_name: bookingDetails.customerName,
      customer_email: bookingDetails.email,
      customer_phone: bookingDetails.phone || null,
      vehicle_registration: bookingDetails.vehicleReg,
      vehicle_type: bookingDetails.vehicleType || null,
      special_requests: bookingDetails.specialRequests || null,
      payment_intent_id: paymentIntent.id,
      sku: sku,
      duration_type: duration,
      created_at: new Date().toISOString(),
    }

    const { data: booking, error: bookingError } = await supabase.from("bookings").insert(bookingData).select().single()

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
