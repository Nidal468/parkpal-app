import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔄 Confirm order request:", JSON.stringify(body, null, 2))

    const { orderId, paymentIntentId } = body

    if (!orderId || !paymentIntentId) {
      console.error("❌ Missing orderId or paymentIntentId")
      return NextResponse.json({ error: "Order ID and Payment Intent ID are required" }, { status: 400 })
    }

    // Get Commerce Layer credentials
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      console.error("❌ Missing Commerce Layer configuration")
      return NextResponse.json({ error: "Commerce Layer not configured" }, { status: 500 })
    }

    // Get access token
    console.log("🔑 Getting access token for order confirmation...")
    let accessToken: string
    try {
      accessToken = await getAccessTokenWithMarketScope(clClientId, clClientSecret, clBaseUrl, clMarketId)
      console.log("✅ Access token obtained for confirmation")
    } catch (tokenError) {
      console.error("❌ Failed to get access token for confirmation:", tokenError)
      return NextResponse.json(
        {
          error: "Failed to authenticate with Commerce Layer",
          details: tokenError instanceof Error ? tokenError.message : "Unknown authentication error",
        },
        { status: 500 },
      )
    }

    const apiBase = `${clBaseUrl}/api`

    // Update order status to confirmed
    try {
      console.log("📦 Updating order status to confirmed...")

      const updatePayload = {
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
      }

      console.log("📦 Update payload:", JSON.stringify(updatePayload, null, 2))

      const updateResponse = await fetch(`${apiBase}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(updatePayload),
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error("❌ Order update failed:", updateResponse.status, errorText)
        throw new Error(`Order update failed: ${updateResponse.status} ${errorText}`)
      }

      const updatedOrderData = await updateResponse.json()
      console.log("✅ Order updated successfully:", JSON.stringify(updatedOrderData, null, 2))

      // Update booking in database
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
            .eq("commerce_layer_order_id", orderId)
            .select()

          if (error) {
            console.error("❌ Database update error:", error)
          } else {
            console.log("✅ Booking status updated in database:", data)
          }
        }
      } catch (dbError) {
        console.error("❌ Database update failed:", dbError)
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        paymentIntentId: paymentIntentId,
        status: "confirmed",
        message: "Order confirmed successfully",
      })
    } catch (updateError) {
      console.error("❌ Order confirmation error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to confirm order",
          details: updateError instanceof Error ? updateError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Confirm order error:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm order",
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
  console.log("🔑 Requesting access token for confirmation...")

  const tokenPayload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `market:${marketId}`,
  }

  try {
    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenPayload),
    })

    console.log("🔑 Confirmation token response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("🔑 Confirmation token error:", errorText)
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Confirmation access token obtained")
    return data.access_token
  } catch (fetchError) {
    console.error("🔑 Confirmation token request failed:", fetchError)
    throw new Error(`Token request failed: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`)
  }
}
