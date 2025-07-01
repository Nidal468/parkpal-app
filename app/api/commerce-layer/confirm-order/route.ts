import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId } = body

    console.log("Confirming Commerce Layer order:", { orderId, paymentIntentId })

    // In a real implementation, you would:
    // 1. Confirm the order in Commerce Layer
    // 2. Update the booking status in your database
    // 3. Send confirmation emails
    // 4. Trigger any webhooks or notifications

    // Update booking status in database
    const { data: bookings } = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?commerce_layer_order_id=eq.${orderId}`,
      {
        method: "GET",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
        },
      },
    ).then((res) => res.json())

    if (bookings && bookings.length > 0) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?id=eq.${bookings[0].id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          status: "confirmed",
          stripe_payment_intent_id: paymentIntentId,
          confirmed_at: new Date().toISOString(),
        }),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Order confirmed successfully",
    })
  } catch (error) {
    console.error("Error confirming Commerce Layer order:", error)
    return NextResponse.json({ success: false, error: "Failed to confirm order" }, { status: 500 })
  }
}
