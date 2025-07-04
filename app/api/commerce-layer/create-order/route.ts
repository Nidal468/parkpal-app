import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

// SKU to Space mapping
const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

export async function POST(request: Request) {
  try {
    console.log("🛒 Creating Commerce Layer order...")

    const body = await request.json()
    const { sku, customerName, customerEmail, quantity = 1 } = body

    if (!sku || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields: sku, customerName, customerEmail" }, { status: 400 })
    }

    console.log("📋 Order details:", { sku, customerName, customerEmail, quantity })

    // Get space ID for this SKU
    const spaceId = SKU_TO_SPACE_MAP[sku as keyof typeof SKU_TO_SPACE_MAP]
    if (!spaceId) {
      return NextResponse.json({ error: `Invalid SKU: ${sku}` }, { status: 400 })
    }

    console.log("📍 Mapped to space:", spaceId)

    // Get environment variables - using your confirmed setup
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
    const scope = process.env.NEXT_PUBLIC_CL_SCOPE!
    const marketId = "vjkaZhNPnl" // Your confirmed market ID
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL!

    console.log("🔧 Using environment configuration:")
    console.log("- Client ID:", clientId.substring(0, 20) + "...")
    console.log("- Market ID:", marketId)
    console.log("- Scope:", scope)
    console.log("- Base URL:", baseUrl)

    // Get access token with Integration App credentials
    console.log("🔑 Getting access token with Integration App credentials...")
    const { getCommerceLayerAccessToken } = await import("@/lib/commerce-layer-auth")
    const accessToken = await getCommerceLayerAccessToken(clientId, clientSecret, scope)

    console.log("✅ Access token obtained")

    // Create customer
    console.log("👤 Creating customer...")
    const customerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "customers",
          attributes: {
            email: customerEmail,
            metadata: {
              name: customerName,
              source: "parkpal_booking",
              space_id: spaceId,
              sku: sku,
            },
          },
        },
      }),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error("❌ Customer creation failed:", customerResponse.status, errorText)
      return NextResponse.json(
        { error: `Customer creation failed: ${customerResponse.status} ${errorText}` },
        { status: 500 },
      )
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.data.id
    console.log("✅ Customer created:", customerId)

    // Create order
    console.log("📦 Creating order...")
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "orders",
          attributes: {
            metadata: {
              sku: sku,
              customer_name: customerName,
              space_id: spaceId,
              quantity: quantity,
              source: "parkpal_booking",
            },
          },
          relationships: {
            market: {
              data: {
                type: "markets",
                id: marketId,
              },
            },
            customer: {
              data: {
                type: "customers",
                id: customerId,
              },
            },
          },
        },
      }),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("❌ Order creation failed:", orderResponse.status, errorText)
      return NextResponse.json(
        { error: `Order creation failed: ${orderResponse.status} ${errorText}` },
        { status: 500 },
      )
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id
    console.log("✅ Order created:", orderId)

    // Store booking in Supabase
    console.log("💾 Storing booking in database...")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    )

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        customer_email: customerEmail,
        customer_name: customerName,
        sku: sku,
        quantity: quantity,
        status: "pending",
        commerce_layer_order_id: orderId,
        commerce_layer_customer_id: customerId,
        commerce_layer_market_id: marketId,
        metadata: {
          source: "commerce_layer_integration",
          created_via: "api_endpoint",
          payment_gateway_id: "PxpOwsDWKk",
          payment_method_id: "KkqYWsPzjk",
        },
      })
      .select()
      .single()

    if (bookingError) {
      console.error("❌ Booking storage failed:", bookingError)
      return NextResponse.json({ error: `Booking storage failed: ${bookingError.message}` }, { status: 500 })
    }

    console.log("✅ Booking stored:", bookingData.id)

    return NextResponse.json({
      success: true,
      orderId,
      customerId,
      bookingId: bookingData.id,
      spaceId,
      marketId,
      message: "Order created successfully with linked payment method",
    })
  } catch (error) {
    console.error("❌ Order creation failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Order creation failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Commerce Layer order creation endpoint",
    usage: "POST /api/commerce-layer/create-order",
    requiredFields: ["sku", "customerName", "customerEmail"],
    optionalFields: ["quantity"],
    supportedSKUs: ["parking-hour", "parking-day", "parking-month"],
    example: {
      sku: "parking-hour",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      quantity: 1,
    },
  })
}
