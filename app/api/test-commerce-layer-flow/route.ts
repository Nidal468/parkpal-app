import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Starting Commerce Layer flow test...")

    // Test 1: Check space mapping
    console.log("📍 Testing space mapping...")
    const spaceTestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/commerce-layer/get-test-spaces`,
    )
    const spaceData = await spaceTestResponse.json()

    if (!spaceTestResponse.ok) {
      throw new Error(`Space mapping test failed: ${spaceData.error}`)
    }

    console.log("✅ Space mapping test passed")

    // Test 2: Test order creation for each SKU type
    const testOrders = []
    const skuTypes = ["parking-hour", "parking-day", "parking-month"]

    for (const sku of skuTypes) {
      console.log(`📦 Testing order creation for SKU: ${sku}`)

      const orderPayload = {
        sku: sku,
        quantity: 1,
        customerDetails: {
          name: `Test Customer ${sku}`,
          email: `test-${sku}@parkpal.com`,
          phone: "+44 7700 900123",
        },
        bookingDetails: {
          vehicleReg: "TEST123",
          vehicleType: "car",
          startDate: new Date().toISOString().split("T")[0],
          startTime: "09:00",
          specialRequests: `Test booking for ${sku}`,
        },
      }

      try {
        const orderResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/commerce-layer/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderPayload),
          },
        )

        const orderData = await orderResponse.json()

        testOrders.push({
          sku: sku,
          success: orderResponse.ok,
          orderId: orderData.orderId || null,
          spaceId: orderData.spaceId || null,
          bookingId: orderData.bookingId || null,
          error: orderData.error || null,
          status: orderResponse.status,
        })

        console.log(
          `${orderResponse.ok ? "✅" : "❌"} Order test for ${sku}: ${orderResponse.ok ? "SUCCESS" : "FAILED"}`,
        )
      } catch (error) {
        console.error(`❌ Order test for ${sku} failed:`, error)
        testOrders.push({
          sku: sku,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          status: 500,
        })
      }
    }

    // Test 3: Verify database records
    console.log("💾 Testing database records...")
    const databaseTest = { success: false, error: null, bookingCount: 0 }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Check recent bookings
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("id, space_id, sku, customer_email, created_at")
          .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
          .order("created_at", { ascending: false })

        if (error) {
          databaseTest.error = error.message
        } else {
          databaseTest.success = true
          databaseTest.bookingCount = bookings?.length || 0
        }
      }
    } catch (dbError) {
      databaseTest.error = dbError instanceof Error ? dbError.message : "Database connection failed"
    }

    // Compile test results
    const testResults = {
      timestamp: new Date().toISOString(),
      overallSuccess: spaceData.success && testOrders.every((order) => order.success) && databaseTest.success,
      tests: {
        spaceMapping: {
          success: spaceData.success,
          hardcodedSpaceIds: spaceData.hardcodedSpaceIds,
          skuMapping: spaceData.skuMapping,
        },
        orderCreation: {
          success: testOrders.every((order) => order.success),
          results: testOrders,
          successCount: testOrders.filter((order) => order.success).length,
          totalCount: testOrders.length,
        },
        database: databaseTest,
      },
      nextSteps: [
        "Check the browser console for detailed logs",
        "Visit /api/commerce-layer/get-test-spaces to see space mapping",
        "Try manual order creation via the booking interface",
        "Check Supabase bookings table for new records",
      ],
    }

    console.log("🎯 Test Results:", JSON.stringify(testResults, null, 2))

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ Commerce Layer flow test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
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
