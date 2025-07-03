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

export async function GET() {
  try {
    console.log("🧪 Starting Commerce Layer full test suite...")

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    )

    const results = {
      success: false,
      timestamp: new Date().toISOString(),
      tests: {
        spaceMapping: { success: false, details: {} },
        orderCreation: { success: false, orders: [], errors: [] },
        databaseInsertion: { success: false, bookings: [], errors: [] },
      },
      summary: {},
    }

    // Test 1: Space Mapping
    console.log("🗺️ Testing space mapping...")
    try {
      const { data: spaces, error: spacesError } = await supabase
        .from("spaces")
        .select("id, name, location, hourly_rate, daily_rate, monthly_rate")
        .in("id", Object.values(SPACE_IDS))

      if (spacesError) {
        results.tests.spaceMapping.details = { error: spacesError.message }
      } else {
        results.tests.spaceMapping.success = true
        results.tests.spaceMapping.details = {
          hardcodedIds: SPACE_IDS,
          foundSpaces: spaces?.length || 0,
          spaces: spaces || [],
          mapping: SKU_TO_SPACE_MAP,
        }
      }
    } catch (error) {
      results.tests.spaceMapping.details = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    // Test 2: Order Creation for each SKU - ONLY using NEXT_PUBLIC_CL_ variables
    console.log("📦 Testing order creation...")
    const testSKUs = ["parking-hour", "parking-day", "parking-month"]

    for (const sku of testSKUs) {
      try {
        console.log(`🔄 Testing SKU: ${sku}`)

        // Get Commerce Layer access token - ONLY using NEXT_PUBLIC_CL_ variables
        const accessToken = await getCommerceLayerAccessToken(
          process.env.NEXT_PUBLIC_CL_CLIENT_ID!,
          process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!,
          process.env.NEXT_PUBLIC_CL_MARKET_ID!,
          process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
        )

        // Create order payload
        const orderPayload = {
          data: {
            type: "orders",
            attributes: {
              customer_email: `test-${sku}@example.com`,
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

        // Create order
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

          // Add line item
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

            results.tests.orderCreation.orders.push({
              sku,
              orderId,
              lineItemId: lineItemData.data.id,
              success: true,
            })

            // Test 3: Database insertion
            console.log(`💾 Testing database insertion for ${sku}...`)
            try {
              const spaceId = SKU_TO_SPACE_MAP[sku as keyof typeof SKU_TO_SPACE_MAP]

              const { data: booking, error: bookingError } = await supabase
                .from("bookings")
                .insert({
                  space_id: spaceId,
                  customer_email: `test-${sku}@example.com`,
                  customer_name: `Test User ${sku}`,
                  start_time: new Date().toISOString(),
                  end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
                  total_amount: 10.0,
                  status: "confirmed",
                  sku: sku,
                  commerce_layer_order_id: orderId,
                  commerce_layer_line_item_id: lineItemData.data.id,
                })
                .select()
                .single()

              if (bookingError) {
                results.tests.databaseInsertion.errors.push({
                  sku,
                  error: bookingError.message,
                })
              } else {
                results.tests.databaseInsertion.bookings.push({
                  sku,
                  bookingId: booking.id,
                  spaceId: booking.space_id,
                  success: true,
                })
              }
            } catch (dbError) {
              results.tests.databaseInsertion.errors.push({
                sku,
                error: dbError instanceof Error ? dbError.message : "Unknown database error",
              })
            }
          } else {
            const lineItemError = await lineItemResponse.text()
            results.tests.orderCreation.errors.push({
              sku,
              step: "line_item",
              error: `${lineItemResponse.status}: ${lineItemError}`,
            })
          }
        } else {
          const orderError = await orderResponse.text()
          results.tests.orderCreation.errors.push({
            sku,
            step: "order",
            error: `${orderResponse.status}: ${orderError}`,
          })
        }
      } catch (error) {
        results.tests.orderCreation.errors.push({
          sku,
          step: "general",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Set success flags
    results.tests.orderCreation.success = results.tests.orderCreation.orders.length > 0
    results.tests.databaseInsertion.success = results.tests.databaseInsertion.bookings.length > 0

    // Overall success
    results.success =
      results.tests.spaceMapping.success &&
      results.tests.orderCreation.success &&
      results.tests.databaseInsertion.success

    // Summary
    results.summary = {
      spaceMappingPassed: results.tests.spaceMapping.success,
      ordersCreated: results.tests.orderCreation.orders.length,
      orderErrors: results.tests.orderCreation.errors.length,
      bookingsCreated: results.tests.databaseInsertion.bookings.length,
      bookingErrors: results.tests.databaseInsertion.errors.length,
      overallSuccess: results.success,
    }

    console.log("✅ Test suite completed")
    return NextResponse.json(results)
  } catch (error) {
    console.error("❌ Test suite failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test suite failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message:
      "Use GET to run the test suite. This endpoint tests the complete Commerce Layer flow with hardcoded space UUIDs.",
    usage: "GET /api/test-commerce-layer-flow",
  })
}
