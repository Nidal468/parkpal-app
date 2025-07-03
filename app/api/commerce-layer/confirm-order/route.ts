import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId } = body

    console.log("✅ Confirming Commerce Layer order:", { orderId, paymentIntentId })

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing required environment variables",
        },
        { status: 500 },
      )
    }

    // Get access token using centralized function
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    const apiBase = `${clBaseUrl}/api`

    // Update order status to confirmed
    const updateOrderPayload = {
      data: {
        type: "orders",
        id: orderId,
        attributes: {
          metadata: {
            stripe_payment_intent_id: paymentIntentId,
            payment_status: "completed",
            confirmed_at: new Date().toISOString(),
          },
        },
      },
    }

    const updateResponse = await fetch(`${apiBase}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(updateOrderPayload),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("❌ Order confirmation failed:", updateResponse.status, errorText)
      throw new Error(`Order confirmation failed: ${updateResponse.status} ${errorText}`)
    }

    const updatedOrder = await updateResponse.json()
    console.log("✅ Order confirmed successfully:", updatedOrder.data.id)

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
            stripe_payment_intent_id: paymentIntentId,
            confirmed_at: new Date().toISOString(),
          })
          .eq("commerce_layer_order_id", orderId)

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking status updated in database")
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
