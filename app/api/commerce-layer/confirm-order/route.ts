import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId } = body

    console.log("🔄 Confirming Commerce Layer order:", { orderId, paymentIntentId })

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get Commerce Layer credentials
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json({ error: "Commerce Layer not configured" }, { status: 500 })
    }

    // Use the exact scope format with Integration app credentials
    const scope = `market:${clMarketId} stock_location:okJbPuNbjk`

    // Get access token with Integration app credentials
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: scope,
    }

    console.log("🔑 Getting access token for order confirmation with Integration app...")
    console.log("🔑 Using scope:", scope)

    const tokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenPayload),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token request failed:", tokenResponse.status, errorText)
      return NextResponse.json({ error: "Failed to authenticate with Commerce Layer" }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    console.log("✅ Access token obtained for order confirmation")

    // Update order status to confirmed
    const updateOrderPayload = {
      data: {
        type: "orders",
        id: orderId,
        attributes: {
          metadata: {
            payment_confirmed: true,
            stripe_payment_intent_id: paymentIntentId,
            confirmed_at: new Date().toISOString(),
          },
        },
      },
    }

    const updateOrderResponse = await fetch(`${clBaseUrl}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(updateOrderPayload),
    })

    if (!updateOrderResponse.ok) {
      const errorText = await updateOrderResponse.text()
      console.error("❌ Order update failed:", updateOrderResponse.status, errorText)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    const updatedOrder = await updateOrderResponse.json()

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
            payment_status: "paid",
            confirmed_at: new Date().toISOString(),
          })
          .eq("commerce_layer_order_id", orderId)

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking confirmed in database")
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    console.log("✅ Order confirmed successfully")
    return NextResponse.json({
      success: true,
      orderId: orderId,
      status: "confirmed",
      order: updatedOrder.data,
    })
  } catch (error) {
    console.error("❌ Order confirmation error:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
