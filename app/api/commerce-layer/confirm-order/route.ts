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
