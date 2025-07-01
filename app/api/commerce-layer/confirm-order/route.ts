import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Commerce Layer - Confirm order request:", body)

    const { orderId, paymentIntentId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment Intent ID is required" }, { status: 400 })
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
          details: "Missing Commerce Layer environment variables",
        },
        { status: 500 },
      )
    }

    // Get Commerce Layer access token
    const accessToken = await getAccessTokenWithMarketScope(clClientId, clClientSecret, clBaseUrl, clMarketId)

    // Initialize Commerce Layer API base URL
    const apiBase = `${clBaseUrl}/api`

    // Verify Stripe payment was successful
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (stripeSecretKey) {
      try {
        const Stripe = (await import("stripe")).default
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2024-12-18.acacia",
        })

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (paymentIntent.status !== "succeeded") {
          return NextResponse.json(
            {
              error: "Payment not completed",
              details: `Payment status: ${paymentIntent.status}`,
            },
            { status: 400 },
          )
        }

        console.log("✅ Stripe payment verified:", paymentIntent.id)
      } catch (stripeError) {
        console.error("❌ Stripe verification error:", stripeError)
        return NextResponse.json(
          {
            error: "Failed to verify payment",
            details: stripeError instanceof Error ? stripeError.message : "Unknown Stripe error",
          },
          { status: 500 },
        )
      }
    }

    // Update Commerce Layer order status
    try {
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
              _place: true, // This places the order in Commerce Layer
              metadata: {
                payment_confirmed: true,
                stripe_payment_intent_id: paymentIntentId,
                confirmed_at: new Date().toISOString(),
              },
            },
          },
        }),
      })

      if (!updateOrderResponse.ok) {
        const errorText = await updateOrderResponse.text()
        console.error("❌ Order update failed:", updateOrderResponse.status, errorText)
        throw new Error(`Order update failed: ${updateOrderResponse.status} ${errorText}`)
      }

      const updatedOrderData = await updateOrderResponse.json()
      console.log("✅ Order placed successfully:", updatedOrderData.data.id)

      // Update booking status in database
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
              updated_at: new Date().toISOString(),
            })
            .eq("commerce_layer_order_id", orderId)

          if (error) {
            console.error("❌ Database update error:", error)
          } else {
            console.log("✅ Booking status updated to confirmed")
          }
        }
      } catch (dbError) {
        console.error("❌ Database connection error:", dbError)
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        status: updatedOrderData.data.attributes.status,
        message: "Order confirmed successfully",
        bookingReference: `PK${Date.now().toString().slice(-6)}`,
      })
    } catch (orderError) {
      console.error("❌ Order confirmation error:", orderError)
      return NextResponse.json(
        {
          error: "Failed to confirm order",
          details: orderError instanceof Error ? orderError.message : "Unknown order error",
        },
        { status: 500 },
      )
    }
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
  const tokenPayload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `market:${marketId}`,
  }

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokenPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}
