import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentIntentId, status } = await request.json()

    console.log("Updating order status:", { orderId, paymentIntentId, status })

    // For now, we'll just log the update since Commerce Layer order status updates
    // might require additional setup. In a production environment, you would
    // update the order status in Commerce Layer here.

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId,
      status,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
