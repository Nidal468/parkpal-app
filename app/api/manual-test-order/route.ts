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

async function getCommerceLayerToken() {
  try {
    const clientId = process.env.COMMERCE_LAYER_CLIENT_ID || process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET || process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const scope = process.env.COMMERCE_LAYER_SCOPE || process.env.NEXT_PUBLIC_CL_SCOPE

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error("Missing Commerce Layer credentials")
    }

    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
      }),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      throw new Error(`Auth failed: ${authResponse.status} - ${errorText}`)
    }

    const authData = await authResponse.json()
    return authData.access_token
  } catch (error) {
    throw new Error(`Commerce Layer auth failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku = "parking-hour", customerName = "Test User", customerEmail = "test@example.com" } = body

    console.log(`🧪 Manual test order creation for SKU: ${sku}`)

    // Get space ID for this SKU
    const spaceId = SKU_TO_SPACE_MAP[sku as keyof typeof SKU_TO_SPACE_MAP] || SPACE_IDS.HOURLY

    // Get Commerce Layer token
    const token = await getCommerceLayerToken()
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID

    // Create customer
    const customerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "customers",
          attributes: {
            email: customerEmail,
            metadata: {
              name: customerName,
              phone: "+44 7700 900123",
            },
          },
        },
      }),
    })

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text()
      throw new Error(`Customer creation failed: ${customerResponse.status} - ${errorText}`)
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.data.id

    // Create order
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "orders",
          attributes: {
            metadata: {
              sku: sku,
              spaceId: spaceId,
              bookingDetails: {
                vehicleReg: "TEST123",
                vehicleType: "car",
                startDate: new Date().toISOString().split("T")[0],
                startTime: "10:00",
                specialRequests: `Manual test booking for ${sku} at ${new Date().toISOString()}`,
              },
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
      throw new Error(`Order creation failed: ${orderResponse.status} - ${errorText}`)
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id

    // Create booking in database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: "+44 7700 900123",
        vehicle_registration: "TEST123",
        vehicle_type: "car",
        start_date: new Date().toISOString().split("T")[0],
        start_time: "10:00",
        special_requests: `Manual test booking for ${sku} at ${new Date().toISOString()}`,
        status: "confirmed",
        sku: sku,
        commerce_layer_order_id: orderId,
        commerce_layer_customer_id: customerId,
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error(`Database booking creation failed: ${bookingError.message}`)
    }

    const result = {
      success: true,
      status: 200,
      orderData: {
        orderId: orderId,
        spaceId: spaceId,
        customerId: customerId,
        amount: "10.00",
        bookingId: booking.id,
      },
      bookingRecord: booking,
      testPayload: {
        sku,
        customerName,
        customerEmail,
      },
      timestamp: new Date().toISOString(),
      message: `✅ Order created successfully! Order ID: ${orderId}, Space ID: ${spaceId}`,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Manual test order failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Manual test order endpoint",
    usage: "POST /api/manual-test-order",
    payload: {
      sku: "parking-hour | parking-day | parking-month",
      customerName: "Your Name",
      customerEmail: "your@email.com",
    },
    examples: [
      {
        description: "Test hourly parking",
        payload: { sku: "parking-hour", customerName: "John Doe", customerEmail: "john@example.com" },
      },
      {
        description: "Test daily parking",
        payload: { sku: "parking-day", customerName: "Jane Smith", customerEmail: "jane@example.com" },
      },
      {
        description: "Test monthly parking",
        payload: { sku: "parking-month", customerName: "Bob Wilson", customerEmail: "bob@example.com" },
      },
    ],
  })
}
