// Integration layer between Parkpal and the forked demo-store-core
import { CL_CONFIG, PARKPAL_SKUS, DEMO_STORE_ENDPOINTS } from "./commerce-layer-config"
import { getCommerceLayerAccessToken } from "./commerce-layer-auth"

export interface ParkpalBookingRequest {
  // Customer details
  customerName: string
  customerEmail: string
  customerPhone?: string

  // Vehicle details
  vehicleRegistration: string
  vehicleType: "car" | "motorcycle" | "van" | "truck"

  // Booking details
  sku: keyof typeof PARKPAL_SKUS
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  quantity: number

  // Space details
  spaceId?: string
  location?: string
  specialRequests?: string
}

export interface DemoStoreOrder {
  id: string
  customerId: string
  status: string
  total: number
  currency: string
  checkoutUrl: string
  lineItems: Array<{
    id: string
    skuCode: string
    quantity: number
    unitAmount: number
  }>
}

export class DemoStoreIntegration {
  private accessToken: string | null = null

  constructor() {}

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await getCommerceLayerAccessToken(
        CL_CONFIG.CLIENT_ID,
        CL_CONFIG.CLIENT_SECRET,
        CL_CONFIG.SCOPE,
      )
    }
    return this.accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken()

    const response = await fetch(`${CL_CONFIG.BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Demo store API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Create customer using demo-store-core structure
  async createCustomer(bookingData: ParkpalBookingRequest): Promise<string> {
    console.log("👤 Creating customer in demo-store-core...")

    const customerPayload = {
      data: {
        type: "customers",
        attributes: {
          email: bookingData.customerEmail,
          first_name: bookingData.customerName.split(" ")[0] || bookingData.customerName,
          last_name: bookingData.customerName.split(" ").slice(1).join(" ") || "",
          metadata: {
            // Parkpal specific metadata
            source: "parkpal_booking",
            vehicle_registration: bookingData.vehicleRegistration,
            vehicle_type: bookingData.vehicleType,
            phone: bookingData.customerPhone,
            booking_start_date: bookingData.startDate.toISOString(),
            booking_end_date: bookingData.endDate.toISOString(),
            booking_start_time: bookingData.startTime,
            booking_end_time: bookingData.endTime,
            special_requests: bookingData.specialRequests || "",
            space_id: bookingData.spaceId,
            location: bookingData.location,
          },
        },
      },
    }

    const response = await this.makeRequest(DEMO_STORE_ENDPOINTS.CUSTOMERS, {
      method: "POST",
      body: JSON.stringify(customerPayload),
    })

    console.log("✅ Customer created:", response.data.id)
    return response.data.id
  }

  // Create order using demo-store-core structure
  async createOrder(customerId: string, bookingData: ParkpalBookingRequest): Promise<DemoStoreOrder> {
    console.log("📦 Creating order in demo-store-core...")

    const skuData = PARKPAL_SKUS[bookingData.sku]

    // Create order
    const orderPayload = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "USD",
          language_code: "en",
          metadata: {
            // Parkpal booking metadata
            booking_type: "parking",
            sku: bookingData.sku,
            sku_code: skuData.code,
            vehicle_registration: bookingData.vehicleRegistration,
            vehicle_type: bookingData.vehicleType,
            start_date: bookingData.startDate.toISOString(),
            end_date: bookingData.endDate.toISOString(),
            start_time: bookingData.startTime,
            end_time: bookingData.endTime,
            space_id: bookingData.spaceId,
            location: bookingData.location,
            special_requests: bookingData.specialRequests || "",
            source: "parkpal_chat_booking",
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

    const orderResponse = await this.makeRequest(DEMO_STORE_ENDPOINTS.ORDERS, {
      method: "POST",
      body: JSON.stringify(orderPayload),
    })

    const orderId = orderResponse.data.id
    console.log("✅ Order created:", orderId)

    // Add line item
    const lineItemPayload = {
      data: {
        type: "line_items",
        attributes: {
          sku_code: skuData.code,
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

    const lineItemResponse = await this.makeRequest(DEMO_STORE_ENDPOINTS.LINE_ITEMS, {
      method: "POST",
      body: JSON.stringify(lineItemPayload),
    })

    console.log("✅ Line item created:", lineItemResponse.data.id)

    // Return structured order data
    return {
      id: orderId,
      customerId: customerId,
      status: orderResponse.data.attributes.status,
      total: orderResponse.data.attributes.total_amount_cents / 100,
      currency: orderResponse.data.attributes.currency_code,
      checkoutUrl: `${CL_CONFIG.BASE_URL.replace("/api", "")}/checkout/${orderId}`,
      lineItems: [
        {
          id: lineItemResponse.data.id,
          skuCode: skuData.code,
          quantity: bookingData.quantity,
          unitAmount: skuData.price,
        },
      ],
    }
  }

  // Main booking creation method
  async createParkingBooking(bookingData: ParkpalBookingRequest): Promise<DemoStoreOrder> {
    console.log("🚗 Creating Parkpal booking via demo-store-core...")
    console.log("📋 Booking data:", {
      sku: bookingData.sku,
      customer: bookingData.customerEmail,
      vehicle: bookingData.vehicleRegistration,
      dates: `${bookingData.startDate.toLocaleDateString()} - ${bookingData.endDate.toLocaleDateString()}`,
      times: `${bookingData.startTime} - ${bookingData.endTime}`,
    })

    try {
      // Step 1: Create customer
      const customerId = await this.createCustomer(bookingData)

      // Step 2: Create order with line items
      const order = await this.createOrder(customerId, bookingData)

      console.log("✅ Parkpal booking created successfully!")
      console.log("🔗 Checkout URL:", order.checkoutUrl)

      return order
    } catch (error) {
      console.error("❌ Parkpal booking creation failed:", error)
      throw error
    }
  }

  // Verify SKUs exist in Commerce Layer
  async verifyParkpalSKUs(): Promise<boolean> {
    console.log("🔍 Verifying Parkpal SKUs in Commerce Layer...")

    try {
      for (const [key, sku] of Object.entries(PARKPAL_SKUS)) {
        const response = await this.makeRequest(`/skus/${sku.id}`)
        console.log(`✅ SKU ${key} (${sku.code}) verified:`, response.data.attributes.name)
      }
      return true
    } catch (error) {
      console.error("❌ SKU verification failed:", error)
      return false
    }
  }
}
