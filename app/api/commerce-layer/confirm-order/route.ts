import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, paymentIntentId } = body

    // Validate required fields
    if (!bookingId || !paymentIntentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update booking status to confirmed
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_confirmed: true,
      })
      .eq("id", bookingId)
      .eq("payment_intent_id", paymentIntentId)
      .select()
      .single()

    if (updateError) {
      console.error("Booking confirmation error:", updateError)
      return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 })
    }

    // Here you could also:
    // 1. Send confirmation email
    // 2. Update Commerce Layer order status
    // 3. Trigger any webhooks
    // 4. Create calendar events

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking confirmed successfully",
    })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 })
  }
}
