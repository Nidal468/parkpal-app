import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku, customerName, customerEmail, quantity = 1 } = body

    console.log("🛒 Creating Commerce Layer order...")
    console.log("📋 Order details:", { sku, customerName, customerEmail, quantity })

    // Validate required fields
    if (!sku || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields: sku, customerName, customerEmail" }, { status: 400 })
    }

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const scope = process.env.NEXT_PUBLIC_CL_SCOPE
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const marketId = "vjkaZhNPnl"
    const stockLocationId = "okJbPuNbjk"

    // Validate environment variables
    if (!clientId || !clientSecret || !scope || !baseUrl) {
      console.error("❌ Missing environment variables")
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          missing: {
            clientId: !clientId,
            clientSecret: !clientSecret,
            scope: !scope,
            baseUrl: !baseUrl,
          },
        },
        { status: 500 },
      )
    }

    console.log("🔑 Getting access token...")
    const accessToken = await getCommerceLayerAccessToken(clientId, clientSecret, scope)

    // Create customer
    console.log("👤 Creating customer...")
    const customerPayload = {
      data: {
        type: "customers",
        attributes: {
          email: customerEmail,
          first_name: customerName.split(" ")[0] || customerName,
          last_name: customerName.split(" ").slice(1).join(" ") || "",
        },
      },
    }

    const customerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(customerPayload),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      console.error("❌ Customer creation failed:", customerResponse.status, errorText)
      return NextResponse.json(
        { error: `Customer creation failed: ${customerResponse.status}`, details: errorText },
        { status: 500 },
      )
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.data.id
    console.log("✅ Customer created:", customerId)

    // Create order
    console.log("📦 Creating order...")
    const orderPayload = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "USD",
          language_code: "en",
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
    }

    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(orderPayload),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("❌ Order creation failed:", orderResponse.status, errorText)
      return NextResponse.json(
        { error: `Order creation failed: ${orderResponse.status}`, details: errorText },
        { status: 500 },
      )
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id
    console.log("✅ Order created:", orderId)

    // Add line item
    console.log("📝 Adding line item...")
    const lineItemPayload = {
      data: {
        type: "line_items",
        attributes: {
          sku_code: sku,
          quantity: quantity,
        },
        relationships: {
          order: {
            data: {
              type: "orders",
              id: orderId,
            },
          },
        },
      },
    }

    const lineItemResponse = await fetch(`${baseUrl}/api/line_items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(lineItemPayload),
    })

    if (!lineItemResponse.ok) {
      const errorText = await lineItemResponse.text()
      console.error("❌ Line item creation failed:", lineItemResponse.status, errorText)
      return NextResponse.json(
        { error: `Line item creation failed: ${lineItemResponse.status}`, details: errorText },
        { status: 500 },
      )
    }

    const lineItemData = await lineItemResponse.json()
    console.log("✅ Line item added:", lineItemData.data.id)

    // Store booking in Supabase
    console.log("💾 Storing booking in database...")
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        sku: sku,
        quantity: quantity,
        commerce_layer_order_id: orderId,
        commerce_layer_customer_id: customerId,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error("❌ Database booking creation failed:", bookingError)
      // Don't fail the entire request, just log the error
    } else {
      console.log("✅ Booking stored in database:", booking?.id)
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderId: orderId,
      customerId: customerId,
      lineItemId: lineItemData.data.id,
      bookingId: booking?.id,
      checkoutUrl: `${baseUrl}/checkout/${orderId}`,
    })
  } catch (error) {
    console.error("❌ Order creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Order creation failed",
        stack: error instanceof Error ? error.stack : undefined,
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
