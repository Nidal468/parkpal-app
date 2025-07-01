import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId, bookingId } = body

    // Update booking status to confirmed
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        commerce_layer_order_id: orderId,
      })
      .eq("id", bookingId)
      .eq("stripe_payment_intent_id", paymentIntentId)
      .select()
      .single()

    if (updateError) {
      console.error("Booking confirmation error:", updateError)
      return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 })
    }

    // Here you could also:
    // - Send confirmation email
    // - Update Commerce Layer order status
    // - Trigger webhooks
    // - Send SMS notifications

    return NextResponse.json({
      success: true,
      booking: booking,
      message: "Booking confirmed successfully",
    })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
