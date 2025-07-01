import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, quantity, customerDetails, bookingDetails, spaceId } = body

    // Mock Commerce Layer order creation
    // In a real implementation, you would:
    // 1. Authenticate with Commerce Layer
    // 2. Create a customer if needed
    // 3. Add items to cart
    // 4. Create an order
    // 5. Get payment intent from Stripe via Commerce Layer

    console.log("Creating Commerce Layer order:", {
      sku,
      quantity,
      customerDetails,
      bookingDetails,
      spaceId,
    })

    // Mock successful response with client secret
    // In reality, this would come from Commerce Layer/Stripe integration
    const mockOrder = {
      success: true,
      orderId: `cl_order_${Date.now()}`,
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      amount: getAmountForSKU(sku) * quantity,
      currency: "gbp",
    }

    // Store booking details in database
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify({
        space_id: spaceId,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_date: bookingDetails.startDate,
        start_time: bookingDetails.startTime,
        duration_type: sku.replace("parking-", ""),
        quantity: quantity,
        total_amount: mockOrder.amount,
        status: "pending",
        special_requests: bookingDetails.specialRequests,
        commerce_layer_order_id: mockOrder.orderId,
      }),
    })

    return NextResponse.json(mockOrder)
  } catch (error) {
    console.error("Error creating Commerce Layer order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}

function getAmountForSKU(sku: string): number {
  switch (sku) {
    case "parking-hour":
      return 300 // £3.00 in pence
    case "parking-day":
      return 1500 // £15.00 in pence
    case "parking-month":
      return 30000 // £300.00 in pence
    default:
      return 1500
  }
}
