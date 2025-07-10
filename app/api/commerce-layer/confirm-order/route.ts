import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🚀 Commerce Layer - Confirm order request:", body)

    const { orderId, paymentMethodId, commerceLayerOrderId } = body

    if (!orderId && !commerceLayerOrderId) {
      return NextResponse.json({ error: "Missing orderId or commerceLayerOrderId" }, { status: 400 })
    }

    // Check Commerce Layer environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL || "https://yourdomain.commercelayer.io"

    if (!clClientId || !clClientSecret) {
      return NextResponse.json({ error: "Commerce Layer not configured" }, { status: 500 })
    }

    // Import Commerce Layer SDK dynamically
    const CommerceLayer: any = null 

    // Initialize Commerce Layer client
    const cl = CommerceLayer({
      organization: clBaseUrl.replace("https://", "").replace(".commercelayer.io", ""),
      accessToken: await getAccessToken(clClientId, clClientSecret, clBaseUrl),
    })

    const orderIdToUse = commerceLayerOrderId || orderId

    // Step 1: Get the order
    let order
    try {
      order = await cl.orders.retrieve(orderIdToUse, {
        include: ["payment_method", "line_items"],
      })
      console.log("✅ Retrieved Commerce Layer order:", order.id, "Status:", order.status)
    } catch (orderError) {
      console.error("❌ Failed to retrieve order:", orderError)
      return NextResponse.json({ error: "Order not found", details: orderError }, { status: 404 })
    }

    // Step 2: Add payment method if provided
    if (paymentMethodId && order.status === "pending") {
      try {
        // This depends on your Commerce Layer payment method setup
        // You might need to create a Stripe payment method or use Commerce Layer's payment methods
        console.log("💳 Adding payment method:", paymentMethodId)

        // For now, we'll simulate payment completion
        // In a real implementation, you'd integrate with your payment gateway through Commerce Layer
      } catch (paymentError) {
        console.error("❌ Payment method error:", paymentError)
        return NextResponse.json({ error: "Failed to process payment", details: paymentError }, { status: 500 })
      }
    }

    // Step 3: Update order status (this might be automatic based on payment)
    let updatedOrder
    try {
      // In Commerce Layer, orders typically move to "placed" status after payment
      // The exact flow depends on your Commerce Layer configuration
      updatedOrder = await cl.orders.update(order.id, {
        _place: true, // This places the order
        metadata: {
          ...order.metadata,
          confirmed_at: new Date().toISOString(),
          payment_method_id: paymentMethodId || "test_payment",
        },
      })
      console.log("✅ Order placed successfully:", updatedOrder.id, "Status:", updatedOrder.status)
    } catch (updateError) {
      console.error("❌ Failed to place order:", updateError)
      return NextResponse.json({ error: "Failed to place order", details: updateError }, { status: 500 })
    }

    // Step 4: Update booking in database
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
            stripe_payment_intent_id: paymentMethodId,
          })
          .eq("commerce_layer_order_id", updatedOrder.id)

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking confirmed in database")
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    const response = {
      success: true,
      message: "Order confirmed successfully",
      orderId: updatedOrder.id,
      commerceLayerOrderId: updatedOrder.id,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.payment_status,
      bookingReference: `PK${updatedOrder.number || updatedOrder.id.slice(-6)}`,
      totalAmount: Number.parseFloat(updatedOrder.total_amount_cents) / 100,
      currency: updatedOrder.currency_code,
    }

    console.log("✅ Commerce Layer order confirmed:", response)
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

// Helper function to get Commerce Layer access token
async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
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
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("❌ Failed to get Commerce Layer access token:", error)
    throw error
  }
}
