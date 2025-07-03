import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

// Hardcoded space IDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

// SKU to Space mapping
const SKU_TO_SPACE: Record<string, string> = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

function getSpaceIdForSku(sku: string, providedSpaceId?: string): string {
  console.log("🎯 Getting space ID for SKU:", sku)
  console.log("📍 Provided space ID:", providedSpaceId)

  // If a space ID is provided and it's valid, use it
  if (providedSpaceId && validateUUID(providedSpaceId)) {
    // Check if it's one of our known valid UUIDs
    const validSpaceIds = Object.values(SPACE_IDS)
    if (validSpaceIds.includes(providedSpaceId)) {
      console.log("✅ Using provided valid space ID:", providedSpaceId)
      return providedSpaceId
    } else {
      console.log("⚠️ Provided space ID not in our valid list, falling back to SKU mapping")
    }
  }

  // Fall back to SKU-based mapping
  const mappedSpaceId = SKU_TO_SPACE[sku]
  if (mappedSpaceId) {
    console.log("✅ Mapped SKU to space ID:", mappedSpaceId)
    return mappedSpaceId
  }

  // Default fallback
  console.log("⚠️ No mapping found, using default hourly space")
  return SPACE_IDS.HOURLY
}

export async function POST(request: Request) {
  try {
    console.log("🛒 Creating Commerce Layer order...")

    const body = await request.json()
    console.log("📋 Request body:", body)

    const {
      sku = "parking-hour",
      quantity = 1,
      customerName = "Test Customer",
      customerEmail = "test@example.com",
      spaceId: providedSpaceId,
    } = body

    // Get the correct space ID
    const spaceId = getSpaceIdForSku(sku, providedSpaceId)
    console.log("🎯 Final space ID:", spaceId)

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
    const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID!
    const stockLocationId = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID!
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL!

    console.log("🔧 Using Commerce Layer config:")
    console.log("- Market ID:", marketId)
    console.log("- Stock Location ID:", stockLocationId)
    console.log("- Base URL:", baseUrl)

    // Get access token
    console.log("🔑 Getting access token...")
    const accessToken = await getCommerceLayerAccessToken(clientId, clientSecret, marketId, stockLocationId)

    // Create customer first
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
              source: "parkpal",
            },
          },
        },
      }),
    })

    if (!customerResponse.ok) {
      const customerError = await customerResponse.text()
      console.error("❌ Customer creation failed:", customerResponse.status, customerError)
      throw new Error(`Customer creation failed: ${customerResponse.status} ${customerError}`)
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
              source: "parkpal",
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
      const orderError = await orderResponse.text()
      console.error("❌ Order creation failed:", orderResponse.status, orderError)
      throw new Error(`Order creation failed: ${orderResponse.status} ${orderError}`)
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id
    console.log("✅ Order created:", orderId)

    // Store booking in Supabase
    console.log("💾 Storing booking in Supabase...")
    const { createClient } = await import("@supabase/supabase-js")
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
        metadata: {
          source: "api_test",
          created_via: "commerce_layer_integration",
        },
      })
      .select()
      .single()

    if (bookingError) {
      console.error("❌ Booking storage failed:", bookingError)
      throw new Error(`Booking storage failed: ${bookingError.message}`)
    }

    console.log("✅ Booking stored:", bookingData.id)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        orderId: orderId,
        customerId: customerId,
        bookingId: bookingData.id,
        spaceId: spaceId,
        sku: sku,
        customerEmail: customerEmail,
      },
      message: "Order created and booking stored successfully",
    })
  } catch (error) {
    console.error("❌ Order creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Order creation failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
