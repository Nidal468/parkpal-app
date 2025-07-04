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
      const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID
      const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET || process.env.COMMERCE_LAYER_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error("Missing Commerce Layer credentials in environment variables")
      }

      this.accessToken = await getCommerceLayerAccessToken(clientId, clientSecret, CL_CONFIG.SCOPE)
    }
    return this.accessToken
  }

  private async makeBackendRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${DEMO_STORE_CONFIG.API_BASE}${endpoint}`

    console.log(`🌐 Making request to deployed backend: ${url}`)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Add CORS headers
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          ...options.headers,
        },
      })

      console.log(`📡 Backend response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Backend request failed: ${response.status} - ${errorText}`)

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(`Backend authentication failed (401): Check your deployed backend credentials`)
        } else if (response.status === 404) {
          throw new Error(`Backend endpoint not found (404): ${endpoint} may not exist in your deployed backend`)
        } else if (response.status === 500) {
          throw new Error(`Backend server error (500): Internal error in your deployed backend`)
        } else {
          throw new Error(`Backend API error (${response.status}): ${errorText}`)
        }
      }

      const data = await response.json()
      console.log("✅ Backend request successful")
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Backend request error: ${error.message}`)
        throw error
      } else {
        console.error(`❌ Unknown backend error:`, error)
        throw new Error(`Backend request failed: ${String(error)}`)
      }
    }
  }

  private async makeCommerceLayerRequest(endpoint: string, options: RequestInit = {}) {
    try {
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

      console.log(`📡 Commerce Layer response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Commerce Layer request failed: ${response.status} - ${errorText}`)
        throw new Error(`Commerce Layer API error (${response.status}): ${errorText}`)
      }

      return response.json()
    } catch (error) {
      console.error("❌ Commerce Layer request error:", error)
      throw error
    }
  }

  // Test connection to your deployed backend
  async testBackendConnection(): Promise<{
    connected: boolean
    status?: any
    error?: string
  }> {
    try {
      console.log("🔍 Testing connection to deployed demo-store-core...")
      console.log("🌐 Backend URL:", DEMO_STORE_CONFIG.BASE_URL)

      // Try to fetch the homepage first
      const response = await fetch(DEMO_STORE_CONFIG.BASE_URL, {
        method: "GET",
        headers: {
          Accept: "text/html,application/json",
        },
      })

      console.log(`📡 Homepage response: ${response.status}`)

      if (response.ok) {
        console.log("✅ Successfully connected to deployed backend")
        return {
          connected: true,
          status: {
            url: DEMO_STORE_CONFIG.BASE_URL,
            status: response.status,
            statusText: response.statusText,
          },
        }
      } else {
        console.error("❌ Backend connection failed:", response.status)
        return {
          connected: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }
    } catch (error) {
      console.error("❌ Backend connection error:", error)
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Create customer via Commerce Layer (direct approach due to backend issues)
  async createCustomerDirect(bookingData: ParkpalBookingRequest): Promise<string> {
    console.log("👤 Creating customer via Commerce Layer directly...")

    try {
      const customerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: bookingData.customerEmail,
            first_name: bookingData.customerName.split(" ")[0] || bookingData.customerName,
            last_name: bookingData.customerName.split(" ").slice(1).join(" ") || "",
            metadata: {
              source: "parkpal_booking",
              vehicle_registration: bookingData.vehicleRegistration,
              vehicle_type: bookingData.vehicleType,
              phone: bookingData.customerPhone || "",
              booking_start_date: bookingData.startDate.toISOString(),
              booking_end_date: bookingData.endDate.toISOString(),
              booking_start_time: bookingData.startTime,
              booking_end_time: bookingData.endTime,
              special_requests: bookingData.specialRequests || "",
              space_id: bookingData.spaceId || "",
              location: bookingData.location || "",
            },
          },
        },
      }

      const response = await this.makeCommerceLayerRequest(DEMO_STORE_ENDPOINTS.CUSTOMERS, {
        method: "POST",
        body: JSON.stringify(customerPayload),
      })

      console.log("✅ Customer created via Commerce Layer:", response.data.id)
      return response.data.id
    } catch (error) {
      console.error("❌ Customer creation failed:", error)
      throw error
    }
  }

  // Create order via Commerce Layer (direct approach)
  async createOrderDirect(customerId: string, bookingData: ParkpalBookingRequest): Promise<DeployedDemoStoreOrder> {
    console.log("📦 Creating order via Commerce Layer directly...")

    const skuData = PARKPAL_SKUS[bookingData.sku]

    try {
      // Step 1: Create order
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
              space_id: bookingData.spaceId || "",
              location: bookingData.location || "",
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

      const orderResponse = await this.makeCommerceLayerRequest(DEMO_STORE_ENDPOINTS.ORDERS, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })

      const orderId = orderResponse.data.id
      console.log("✅ Order created:", orderId)

      // Step 2: Add line item
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

      console.log("✅ Line item added:", lineItemResponse.data.id)

      // Generate checkout URLs
      const deployedCheckoutUrl = `${DEMO_STORE_CONFIG.BASE_URL}/checkout/${orderId}`
      const commerceLayerCheckoutUrl = `${CL_CONFIG.BASE_URL.replace("/api", "")}/checkout/${orderId}`

      return {
        id: orderId,
        customerId: customerId,
        status: orderResponse.data.attributes.status,
        total: orderResponse.data.attributes.total_amount_cents / 100,
        currency: orderResponse.data.attributes.currency_code,
        checkoutUrl: deployedCheckoutUrl,
        paymentUrl: commerceLayerCheckoutUrl,
        lineItems: [
          {
            id: lineItemResponse.data.id,
            skuCode: skuData.code,
            quantity: bookingData.quantity,
            unitAmount: skuData.price,
          },
        ],
      }
    } catch (error) {
      console.error("❌ Order creation failed:", error)
      throw error
    }
  }

  // Main booking creation method
  async createParkingBooking(bookingData: ParkpalBookingRequest): Promise<DeployedDemoStoreOrder> {
    console.log("🚗 Creating Parkpal booking...")
    console.log(`🌐 Target backend: ${DEMO_STORE_CONFIG.BASE_URL}`)
    console.log("📋 Booking data:", {
      sku: bookingData.sku,
      customer: bookingData.customerEmail,
      vehicle: bookingData.vehicleRegistration,
      dates: `${bookingData.startDate.toLocaleDateString()} - ${bookingData.endDate.toLocaleDateString()}`,
      times: `${bookingData.startTime} - ${bookingData.endTime}`,
    })

    try {
      // Test backend connection first
      const backendTest = await this.testBackendConnection()
      if (!backendTest.connected) {
        console.warn("⚠️ Backend connection failed, using direct Commerce Layer approach")
        console.warn("Backend error:", backendTest.error)
      }

      // Step 1: Create customer (using direct Commerce Layer due to backend issues)
      const customerId = await this.createCustomerDirect(bookingData)

      // Step 2: Create order (using direct Commerce Layer)
      const order = await this.createOrderDirect(customerId, bookingData)

      console.log("✅ Parkpal booking created successfully!")
      console.log("🔗 Checkout URL:", order.checkoutUrl)

      return order
    } catch (error) {
      console.error("❌ Parkpal booking creation failed:", error)
      throw error
    }
  }

  // Verify SKUs exist in Commerce Layer
  async verifyParkpalSKUs(): Promise<{
    success: boolean
    results: Record<string, any>
    errors: string[]
  }> {
    console.log("🔍 Verifying Parkpal SKUs in Commerce Layer...")

    const results: Record<string, any> = {}
    const errors: string[] = []

    try {
      for (const [key, sku] of Object.entries(PARKPAL_SKUS)) {
        try {
          const response = await this.makeCommerceLayerRequest(`/skus/${sku.id}`)
          results[key] = {
            id: sku.id,
            code: sku.code,
            name: response.data.attributes.name,
            verified: true,
          }
          console.log(`✅ SKU ${key} (${sku.code}) verified:`, response.data.attributes.name)
        } catch (error) {
          const errorMsg = `SKU ${key} (${sku.id}) verification failed: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          results[key] = {
            id: sku.id,
            code: sku.code,
            verified: false,
            error: errorMsg,
          }
          console.error(`❌ ${errorMsg}`)
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors,
      }
    } catch (error) {
      console.error("❌ SKU verification failed:", error)
      return {
        success: false,
        results,
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }
  }

  // Get comprehensive status
  async getStatus(): Promise<{
    backend: {
      connected: boolean
      url: string
      error?: string
    }
    commerceLayer: {
      authenticated: boolean
      error?: string
    }
    skus: {
      verified: boolean
      results: Record<string, any>
      errors: string[]
    }
    overall: "READY" | "PARTIAL" | "FAILED"
  }> {
    console.log("📊 Getting comprehensive integration status...")

    // Test backend
    const backendTest = await this.testBackendConnection()

    // Test Commerce Layer authentication
    let commerceLayerTest = { authenticated: false, error: "" }
    try {
      await this.getAccessToken()
      commerceLayerTest = { authenticated: true, error: "" }
    } catch (error) {
      commerceLayerTest = {
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }

    // Test SKUs
    const skuTest = await this.verifyParkpalSKUs()

    // Determine overall status
    let overall: "READY" | "PARTIAL" | "FAILED" = "FAILED"
    if (commerceLayerTest.authenticated && skuTest.success) {
      overall = backendTest.connected ? "READY" : "PARTIAL"
    } else if (commerceLayerTest.authenticated || skuTest.success) {
      overall = "PARTIAL"
    }

    return {
      backend: {
        connected: backendTest.connected,
        url: DEMO_STORE_CONFIG.BASE_URL,
        error: backendTest.error,
      },
      commerceLayer: commerceLayerTest,
      skus: skuTest,
      overall: overall,
    }
  }
}
