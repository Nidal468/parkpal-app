// Integration with your deployed demo-store-core backend
import { CL_CONFIG, PARKPAL_SKUS, DEMO_STORE_CONFIG, DEMO_STORE_ENDPOINTS } from "./commerce-layer-config"
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

export interface DeployedDemoStoreOrder {
  id: string
  customerId: string
  status: string
  total: number
  currency: string
  checkoutUrl: string
  paymentUrl?: string
  lineItems: Array<{
    id: string
    skuCode: string
    quantity: number
    unitAmount: number
  }>
}

export class DeployedDemoStoreIntegration {
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

  private async makeBackendRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${DEMO_STORE_CONFIG.API_BASE}${endpoint}`

    console.log(`🌐 Making request to deployed backend: ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Backend request failed: ${response.status} - ${errorText}`)
      throw new Error(`Deployed demo store API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  private async makeCommerceLayerRequest(endpoint: string, options: RequestInit = {}) {
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
      throw new Error(`Commerce Layer API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Test connection to your deployed backend
  async testBackendConnection(): Promise<boolean> {
    try {
      console.log("🔍 Testing connection to deployed demo-store-core...")

      // Try to fetch the homepage or a health check endpoint
      const response = await fetch(DEMO_STORE_CONFIG.BASE_URL)

      if (response.ok) {
        console.log("✅ Successfully connected to deployed backend")
        return true
      } else {
        console.error("❌ Backend connection failed:", response.status)
        return false
      }
    } catch (error) {
      console.error("❌ Backend connection error:", error)
      return false
    }
  }

  // Create customer via your deployed backend
  async createCustomerViaBackend(bookingData: ParkpalBookingRequest): Promise<string> {
    console.log("👤 Creating customer via deployed demo-store-core...")

    try {
      // First try using your backend's customer creation endpoint
      const customerPayload = {
        email: bookingData.customerEmail,
        firstName: bookingData.customerName.split(" ")[0] || bookingData.customerName,
        lastName: bookingData.customerName.split(" ").slice(1).join(" ") || "",
        metadata: {
          source: "parkpal_booking",
          vehicleRegistration: bookingData.vehicleRegistration,
          vehicleType: bookingData.vehicleType,
          phone: bookingData.customerPhone,
          bookingStartDate: bookingData.startDate.toISOString(),
          bookingEndDate: bookingData.endDate.toISOString(),
          bookingStartTime: bookingData.startTime,
          bookingEndTime: bookingData.endTime,
          specialRequests: bookingData.specialRequests || "",
          spaceId: bookingData.spaceId,
          location: bookingData.location,
        },
      }

      const response = await this.makeBackendRequest(DEMO_STORE_ENDPOINTS.CUSTOMERS, {
        method: "POST",
        body: JSON.stringify(customerPayload),
      })

      console.log("✅ Customer created via backend:", response.id || response.data?.id)
      return response.id || response.data?.id
    } catch (backendError) {
      console.warn("⚠️ Backend customer creation failed, falling back to direct Commerce Layer...")

      // Fallback to direct Commerce Layer API
      const customerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: bookingData.customerEmail,
            first_name: bookingData.customerName.split(" ")[0] || bookingData.customerName,
            last_name: bookingData.customerName.split(" ").slice(1).join(" ") || "",
            metadata: {
              source: "parkpal_booking_fallback",
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

      const response = await this.makeCommerceLayerRequest(DEMO_STORE_ENDPOINTS.CUSTOMERS, {
        method: "POST",
        body: JSON.stringify(customerPayload),
      })

      console.log("✅ Customer created via Commerce Layer fallback:", response.data.id)
      return response.data.id
    }
  }

  // Create order via your deployed backend
  async createOrderViaBackend(customerId: string, bookingData: ParkpalBookingRequest): Promise<DeployedDemoStoreOrder> {
    console.log("📦 Creating order via deployed demo-store-core...")

    const skuData = PARKPAL_SKUS[bookingData.sku]

    try {
      // Try using your backend's order creation endpoint
      const orderPayload = {
        customerId: customerId,
        marketId: CL_CONFIG.MARKET_ID,
        currencyCode: "USD",
        languageCode: "en",
        lineItems: [
          {
            skuCode: skuData.code,
            quantity: bookingData.quantity,
          },
        ],
        metadata: {
          bookingType: "parking",
          sku: bookingData.sku,
          skuCode: skuData.code,
          vehicleRegistration: bookingData.vehicleRegistration,
          vehicleType: bookingData.vehicleType,
          startDate: bookingData.startDate.toISOString(),
          endDate: bookingData.endDate.toISOString(),
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          spaceId: bookingData.spaceId,
          location: bookingData.location,
          specialRequests: bookingData.specialRequests || "",
          source: "parkpal_chat_booking",
        },
      }

      const response = await this.makeBackendRequest(DEMO_STORE_ENDPOINTS.ORDERS, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })

      const orderId = response.id || response.data?.id
      console.log("✅ Order created via backend:", orderId)

      // Generate checkout URL using your deployed backend
      const checkoutUrl = `${DEMO_STORE_CONFIG.BASE_URL}/checkout/${orderId}`

      return {
        id: orderId,
        customerId: customerId,
        status: response.status || response.data?.attributes?.status || "pending",
        total: (response.total || response.data?.attributes?.total_amount_cents || 0) / 100,
        currency: response.currency || response.data?.attributes?.currency_code || "USD",
        checkoutUrl: checkoutUrl,
        paymentUrl: checkoutUrl,
        lineItems: [
          {
            id: response.lineItems?.[0]?.id || "line-item-1",
            skuCode: skuData.code,
            quantity: bookingData.quantity,
            unitAmount: skuData.price,
          },
        ],
      }
    } catch (backendError) {
      console.warn("⚠️ Backend order creation failed, falling back to direct Commerce Layer...")

      // Fallback to direct Commerce Layer API
      const orderPayload = {
        data: {
          type: "orders",
          attributes: {
            currency_code: "USD",
            language_code: "en",
            metadata: {
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
              source: "parkpal_chat_booking_fallback",
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

      const orderResponse = await this.makeCommerceLayerRequest(DEMO_STORE_ENDPOINTS.ORDERS, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })

      const orderId = orderResponse.data.id

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

      const lineItemResponse = await this.makeCommerceLayerRequest(DEMO_STORE_ENDPOINTS.LINE_ITEMS, {
        method: "POST",
        body: JSON.stringify(lineItemPayload),
      })

      console.log("✅ Order created via Commerce Layer fallback:", orderId)

      return {
        id: orderId,
        customerId: customerId,
        status: orderResponse.data.attributes.status,
        total: orderResponse.data.attributes.total_amount_cents / 100,
        currency: orderResponse.data.attributes.currency_code,
        checkoutUrl: `${DEMO_STORE_CONFIG.BASE_URL}/checkout/${orderId}`,
        paymentUrl: `${CL_CONFIG.BASE_URL.replace("/api", "")}/checkout/${orderId}`,
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
  }

  // Main booking creation method using your deployed backend
  async createParkingBooking(bookingData: ParkpalBookingRequest): Promise<DeployedDemoStoreOrder> {
    console.log("🚗 Creating Parkpal booking via deployed demo-store-core...")
    console.log(`🌐 Backend URL: ${DEMO_STORE_CONFIG.BASE_URL}`)
    console.log("📋 Booking data:", {
      sku: bookingData.sku,
      customer: bookingData.customerEmail,
      vehicle: bookingData.vehicleRegistration,
      dates: `${bookingData.startDate.toLocaleDateString()} - ${bookingData.endDate.toLocaleDateString()}`,
      times: `${bookingData.startTime} - ${bookingData.endTime}`,
    })

    try {
      // Test backend connection first
      const backendConnected = await this.testBackendConnection()
      if (!backendConnected) {
        console.warn("⚠️ Backend connection failed, will use fallback methods")
      }

      // Step 1: Create customer
      const customerId = await this.createCustomerViaBackend(bookingData)

      // Step 2: Create order with line items
      const order = await this.createOrderViaBackend(customerId, bookingData)

      console.log("✅ Parkpal booking created successfully via deployed backend!")
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
        const response = await this.makeCommerceLayerRequest(`/skus/${sku.id}`)
        console.log(`✅ SKU ${key} (${sku.code}) verified:`, response.data.attributes.name)
      }
      return true
    } catch (error) {
      console.error("❌ SKU verification failed:", error)
      return false
    }
  }

  // Get backend status and info
  async getBackendStatus(): Promise<any> {
    try {
      console.log("📊 Getting deployed backend status...")

      // Try to get backend info
      const response = await this.makeBackendRequest("/health", {
        method: "GET",
      })

      return {
        connected: true,
        url: DEMO_STORE_CONFIG.BASE_URL,
        status: response,
      }
    } catch (error) {
      return {
        connected: false,
        url: DEMO_STORE_CONFIG.BASE_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
