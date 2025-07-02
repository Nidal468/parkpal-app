import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Confirming Commerce Layer order:", body)

    const { orderId, paymentIntentId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 })
    }

    // Get Commerce Layer credentials
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing Commerce Layer environment variables",
        },
        { status: 500 },
      )
    }

    // Get access token
    const tokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clClientId,
        client_secret: clClientSecret,
        scope: `market:${clMarketId}`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token request failed:", errorText)
      return NextResponse.json(
        {
          error: "Failed to authenticate with Commerce Layer",
          details: errorText,
        },
        { status: 500 },
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Update order status to confirmed
    const apiBase = `${clBaseUrl}/api`
    const updateOrderResponse = await fetch(`${apiBase}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "orders",
          id: orderId,
          attributes: {
            metadata: {
              stripe_payment_intent_id: paymentIntentId,
              payment_status: "succeeded",
              confirmed_at: new Date().toISOString(),
            },
          },
        },
      }),
    })

    if (!updateOrderResponse.ok) {
      const errorText = await updateOrderResponse.text()
      console.error("❌ Order update failed:", errorText)
      return NextResponse.json(
        {
          error: "Failed to update order",
          details: errorText,
        },
        { status: 500 },
      )
    }

    const updatedOrder = await updateOrderResponse.json()
    console.log("✅ Order confirmed:", updatedOrder.data.id)

    // Update booking in database
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { error } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "succeeded",
            confirmed_at: new Date().toISOString(),
          })
          .eq("commerce_layer_order_id", orderId)

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking updated in database")
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      status: "confirmed",
      paymentIntentId: paymentIntentId,
    })
  } catch (error) {
    console.error("❌ Confirm order error:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
