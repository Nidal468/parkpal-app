import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku = "parking-hour", customerName = "Test User", customerEmail = "test@example.com" } = body

    console.log(`🧪 Manual test order for SKU: ${sku}`)

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    )

    const result = {
      success: false,
      timestamp: new Date().toISOString(),
      input: { sku, customerName, customerEmail },
      steps: {
        spaceMapping: { success: false, spaceId: null },
        commerceLayerAuth: { success: false, hasToken: false },
        orderCreation: { success: false, orderId: null },
        lineItemCreation: { success: false, lineItemId: null },
        databaseInsertion: { success: false, bookingId: null },
      },
      errors: [],
    }

    // Step 1: Space Mapping
    console.log("🗺️ Step 1: Space mapping...")
    const spaceId = SKU_TO_SPACE_MAP[sku as keyof typeof SKU_TO_SPACE_MAP]
    if (spaceId) {
      result.steps.spaceMapping.success = true
      result.steps.spaceMapping.spaceId = spaceId
      console.log(`✅ Mapped ${sku} to space ${spaceId}`)
    } else {
      result.errors.push(`No space mapping found for SKU: ${sku}`)
      return NextResponse.json(result, { status: 400 })
    }

    // Step 2: Commerce Layer Authentication - ONLY using NEXT_PUBLIC_CL_ variables
    console.log("🔑 Step 2: Commerce Layer authentication...")
    try {
      const accessToken = await getCommerceLayerAccessToken(
        process.env.NEXT_PUBLIC_CL_CLIENT_ID!,
        process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!,
        process.env.NEXT_PUBLIC_CL_MARKET_ID!,
        process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
      )

      result.steps.commerceLayerAuth.success = true
      result.steps.commerceLayerAuth.hasToken = !!accessToken
      console.log("✅ Commerce Layer authentication successful")

      // Step 3: Create Order
      console.log("📦 Step 3: Creating order...")
      const orderPayload = {
        data: {
          type: "orders",
          attributes: {
            customer_email: customerEmail,
            language_code: "en",
            currency_code: "USD",
          },
          relationships: {
            market: {
              data: {
                type: "markets",
                id: process.env.NEXT_PUBLIC_CL_MARKET_ID,
              },
            },
          },
        },
      }

      const orderResponse = await fetch(`${process.env.COMMERCE_LAYER_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify(orderPayload),
      })

      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        const orderId = orderData.data.id
        result.steps.orderCreation.success = true
        result.steps.orderCreation.orderId = orderId
        console.log(`✅ Order created: ${orderId}`)

        // Step 4: Add Line Item
        console.log("📋 Step 4: Adding line item...")
        const lineItemPayload = {
          data: {
            type: "line_items",
            attributes: {
              quantity: 1,
              sku_code: sku,
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

        const lineItemResponse = await fetch(`${process.env.COMMERCE_LAYER_BASE_URL}/api/line_items`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
          body: JSON.stringify(lineItemPayload),
        })

        if (lineItemResponse.ok) {
          const lineItemData = await lineItemResponse.json()
          const lineItemId = lineItemData.data.id
          result.steps.lineItemCreation.success = true
          result.steps.lineItemCreation.lineItemId = lineItemId
          console.log(`✅ Line item created: ${lineItemId}`)

          // Step 5: Database Insertion
          console.log("💾 Step 5: Database insertion...")
          const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
              space_id: spaceId,
              customer_email: customerEmail,
              customer_name: customerName,
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
              total_amount: 10.0,
              status: "confirmed",
              sku: sku,
              commerce_layer_order_id: orderId,
              commerce_layer_line_item_id: lineItemId,
            })
            .select()
            .single()

          if (bookingError) {
            result.errors.push(`Database insertion failed: ${bookingError.message}`)
          } else {
            result.steps.databaseInsertion.success = true
            result.steps.databaseInsertion.bookingId = booking.id
            console.log(`✅ Booking created: ${booking.id}`)
          }
        } else {
          const lineItemError = await lineItemResponse.text()
          result.errors.push(`Line item creation failed: ${lineItemResponse.status} ${lineItemError}`)
        }
      } else {
        const orderError = await orderResponse.text()
        result.errors.push(`Order creation failed: ${orderResponse.status} ${orderError}`)
      }
    } catch (authError) {
      result.errors.push(
        `Commerce Layer auth failed: ${authError instanceof Error ? authError.message : "Unknown error"}`,
      )
    }

    // Overall success
    result.success =
      result.steps.spaceMapping.success &&
      result.steps.commerceLayerAuth.success &&
      result.steps.orderCreation.success &&
      result.steps.lineItemCreation.success &&
      result.steps.databaseInsertion.success

    console.log(`${result.success ? "✅" : "❌"} Manual test completed`)
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Manual test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Manual test failed",
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
