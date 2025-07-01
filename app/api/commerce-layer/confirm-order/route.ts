import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🚀 Commerce Layer - Confirm order request:", body)

    const { orderId, commerceLayerOrderId, paymentIntentId } = body

    if (!orderId && !commerceLayerOrderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Check Commerce Layer environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing Commerce Layer credentials or market ID",
        },
        { status: 500 },
      )
    }

    // Get Commerce Layer access token with market scope
    const accessToken = await getAccessTokenWithMarketScope(clClientId, clClientSecret, clBaseUrl, clMarketId)
    console.log("✅ Commerce Layer access token obtained for order confirmation")

    // Initialize Commerce Layer API base URL
    const apiBase = `${clBaseUrl}/api`
    const orderIdToUse = commerceLayerOrderId || orderId

    // Step 1: Get the current order status
    console.log("📦 Fetching order:", orderIdToUse)
    const orderResponse = await fetch(`${apiBase}/orders/${orderIdToUse}?include=line_items`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      console.error("❌ Failed to fetch order:", errorData)
      throw new Error(`Failed to fetch order: ${JSON.stringify(errorData)}`)
    }

    const orderData = await orderResponse.json()
    const order = orderData.data

    console.log("✅ Retrieved order:", order.id, "Status:", order.attributes.status)

    // Step 2: Update order status to placed (if payment was successful)
    if (paymentIntentId && order.attributes.status !== "placed") {
      try {
        console.log("📦 Placing order...")
        const updateOrderResponse = await fetch(`${apiBase}/orders/${orderIdToUse}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify({
            data: {
              type: "orders",
              id: orderIdToUse,
              attributes: {
                _place: true,
                metadata: {
                  ...order.attributes.metadata,
                  stripe_payment_intent_id: paymentIntentId,
                  payment_confirmed: true,
                  confirmed_at: new Date().toISOString(),
                },
              },
            },
          }),
        })

        const updatedOrderData = await updateOrderResponse.json()
        console.log("📦 Order update response:", updatedOrderData)

        if (!updateOrderResponse.ok) {
          console.error("❌ Failed to place order:", updatedOrderData)
          // Don't throw error - order was created successfully, just status update failed
        } else {
          console.log("✅ Order placed successfully:", orderIdToUse)
        }
      } catch (placeError) {
        console.error("❌ Error placing order:", placeError)
        // Continue - order was created successfully
      }
    }

    // Step 3: Update booking status in database
    try {
      console.log("💾 Updating booking status in database...")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            stripe_payment_intent_id: paymentIntentId,
            confirmed_at: new Date().toISOString(),
          })
          .eq("commerce_layer_order_id", orderIdToUse)
          .select()
          .single()

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking status updated in database:", data?.id)
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    // Generate booking reference
    const bookingReference = `PK${Date.now().toString().slice(-6)}`

    const response = {
      success: true,
      orderId: orderIdToUse,
      bookingReference: bookingReference,
      status: "confirmed",
      paymentIntentId: paymentIntentId,
      totalAmount: Number.parseFloat(order.attributes.total_amount_cents) / 100,
      currency: order.attributes.currency_code,
      confirmedAt: new Date().toISOString(),
    }

    console.log("✅ Commerce Layer order confirmed successfully:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Commerce Layer confirm order error:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm Commerce Layer order",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

// Helper function to get Commerce Layer access token with market scope
async function getAccessTokenWithMarketScope(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  marketId: string,
): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: `market:${marketId}`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `Failed to get access token: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
      )
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("❌ Failed to get Commerce Layer access token:", error)
    throw error
  }
}
