import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"
import { PARKPAL_SKUS, CL_CONFIG, SKU_TO_SPACE_MAP } from "@/lib/commerce-layer-config"

export interface ParkingBookingData {
  sku: keyof typeof PARKPAL_SKUS
  customerName: string
  customerEmail: string
  vehicleRegistration: string
  vehicleType: string
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  specialRequests?: string
  quantity: number
}

export interface CommerceLayerOrder {
  id: string
  customerId: string
  lineItemId: string
  total: number
  currency: string
  status: string
  checkoutUrl?: string
}

export class CommerceLayerService {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl = process.env.COMMERCE_LAYER_BASE_URL!
    this.clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
    this.clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
  }

  private async getAccessToken(): Promise<string> {
    return getCommerceLayerAccessToken(this.clientId, this.clientSecret, CL_CONFIG.SCOPE)
  }

  async createCustomer(bookingData: ParkingBookingData): Promise<string> {
    const accessToken = await this.getAccessToken()

    const customerPayload = {
      data: {
        type: "customers",
        attributes: {
          email: bookingData.customerEmail,
          first_name: bookingData.customerName.split(" ")[0] || bookingData.customerName,
          last_name: bookingData.customerName.split(" ").slice(1).join(" ") || "",
          metadata: {
            vehicle_registration: bookingData.vehicleRegistration,
            vehicle_type: bookingData.vehicleType,
            booking_start_date: bookingData.startDate.toISOString(),
            booking_end_date: bookingData.endDate.toISOString(),
            booking_start_time: bookingData.startTime,
            booking_end_time: bookingData.endTime,
            special_requests: bookingData.specialRequests || "",
            source: "parkpal_chat_booking",
          },
        },
      },
    }

    const response = await fetch(`${this.baseUrl}/api/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(customerPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Customer creation failed: ${response.status} - ${errorText}`)
    }

    const customerData = await response.json()
    return customerData.data.id
  }

  async createOrder(customerId: string, bookingData: ParkingBookingData): Promise<CommerceLayerOrder> {
    const accessToken = await this.getAccessToken()

    // Create order
    const orderPayload = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "USD",
          language_code: "en",
          metadata: {
            booking_type: "parking",
            sku: bookingData.sku,
            vehicle_registration: bookingData.vehicleRegistration,
            vehicle_type: bookingData.vehicleType,
            start_date: bookingData.startDate.toISOString(),
            end_date: bookingData.endDate.toISOString(),
            start_time: bookingData.startTime,
            end_time: bookingData.endTime,
            space_id: SKU_TO_SPACE_MAP[PARKPAL_SKUS[bookingData.sku].code as keyof typeof SKU_TO_SPACE_MAP],
            special_requests: bookingData.specialRequests || "",
          },
        },
        relationships: {
          market: {
            data: {
              type: "markets",
              id: CL_CONFIG.MARKET_ID,
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

    const orderResponse = await fetch(`${this.baseUrl}/api/orders`, {
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
      throw new Error(`Order creation failed: ${orderResponse.status} - ${errorText}`)
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id

    // Add line item
    const lineItemPayload = {
      data: {
        type: "line_items",
        attributes: {
          sku_code: PARKPAL_SKUS[bookingData.sku].code,
          quantity: bookingData.quantity,
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

    const lineItemResponse = await fetch(`${this.baseUrl}/api/line_items`, {
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
      throw new Error(`Line item creation failed: ${lineItemResponse.status} - ${errorText}`)
    }

    const lineItemData = await lineItemResponse.json()

    return {
      id: orderId,
      customerId: customerId,
      lineItemId: lineItemData.data.id,
      total: orderData.data.attributes.total_amount_cents / 100,
      currency: orderData.data.attributes.currency_code,
      status: orderData.data.attributes.status,
      checkoutUrl: `${this.baseUrl.replace("/api", "")}/checkout/${orderId}`,
    }
  }

  async createParkingBooking(bookingData: ParkingBookingData): Promise<CommerceLayerOrder> {
    console.log("🚗 Creating parking booking with Commerce Layer...")
    console.log("📋 Booking data:", {
      sku: bookingData.sku,
      customer: bookingData.customerEmail,
      vehicle: bookingData.vehicleRegistration,
      dates: `${bookingData.startDate.toLocaleDateString()} - ${bookingData.endDate.toLocaleDateString()}`,
      times: `${bookingData.startTime} - ${bookingData.endTime}`,
    })

    try {
      // Step 1: Create customer
      console.log("👤 Creating customer...")
      const customerId = await this.createCustomer(bookingData)
      console.log("✅ Customer created:", customerId)

      // Step 2: Create order with line items
      console.log("📦 Creating order...")
      const order = await this.createOrder(customerId, bookingData)
      console.log("✅ Order created:", order.id)

      return order
    } catch (error) {
      console.error("❌ Parking booking creation failed:", error)
      throw error
    }
  }
}
