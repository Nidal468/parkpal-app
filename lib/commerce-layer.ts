// Commerce Layer configuration and utilities
const CL_AUTH_ENDPOINT = "https://auth.commercelayer.io/oauth/token"
const CL_CLIENT_ID = "RMr4qbT6zEvDWkuD9NusLVPbozDul_5QNmYK1dtIQUw"
const CL_CLIENT_SECRET = "4Ov5vQgSfSeD0QdGsnJoQdrs4HQakr8K4vf_FcjdY4Q"

// SKU mappings for our parking spaces
export const PARKING_SKUS = {
  hourly: "parking-hour",
  daily: "parking-day",
  monthly: "parking-month",
} as const

export type ParkingDuration = keyof typeof PARKING_SKUS

// Get access token from Commerce Layer
async function getAccessToken(): Promise<string> {
  try {
    const response = await fetch(CL_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CL_CLIENT_ID,
        client_secret: CL_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Error getting Commerce Layer access token:", error)
    throw error
  }
}

// Make authenticated request to Commerce Layer API
async function clRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken()
  const baseUrl = process.env.NEXT_PUBLIC_CL_BASE_URL || "https://parkpal.commercelayer.io"

  const response = await fetch(`${baseUrl}/api${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Commerce Layer API error: ${response.status} ${response.statusText}`, errorText)
    throw new Error(`Commerce Layer API error: ${response.status}`)
  }

  return response.json()
}

// Create order with line items
export async function createOrder(
  items: Array<{
    skuCode: string
    quantity: number
    metadata?: Record<string, any>
  }>,
) {
  try {
    // Create order
    const orderData = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "GBP",
          language_code: "en",
        },
      },
    }

    const order = await clRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })

    // Add line items to the order
    for (const item of items) {
      const lineItemData = {
        data: {
          type: "line_items",
          attributes: {
            sku_code: item.skuCode,
            quantity: item.quantity,
            _update_quantity: true,
          },
          relationships: {
            order: {
              data: {
                type: "orders",
                id: order.data.id,
              },
            },
          },
        },
      }

      await clRequest("/line_items", {
        method: "POST",
        body: JSON.stringify(lineItemData),
      })
    }

    return order.data
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

// Update order with customer information
export async function updateOrderWithCustomer(
  orderId: string,
  customerData: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  },
) {
  try {
    const updateData = {
      data: {
        type: "orders",
        id: orderId,
        attributes: {
          customer_email: customerData.email,
        },
      },
    }

    const order = await clRequest(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    })

    return order.data
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

// Get order details
export async function getOrder(orderId: string) {
  try {
    const order = await clRequest(`/orders/${orderId}?include=line_items,line_items.item`)
    return order.data
  } catch (error) {
    console.error("Error fetching order:", error)
    throw error
  }
}

// Get SKU details and pricing
export async function getSKUPricing(skuCode: string) {
  try {
    const sku = await clRequest(`/skus/${skuCode}?include=prices`)
    return sku.data
  } catch (error) {
    console.error("Error fetching SKU pricing:", error)
    // Return fallback pricing if Commerce Layer is unavailable
    const fallbackPricing = {
      "parking-hour": { amount_cents: 300, formatted_amount: "£3.00" },
      "parking-day": { amount_cents: 1500, formatted_amount: "£15.00" },
      "parking-month": { amount_cents: 30000, formatted_amount: "£300.00" },
    }
    return fallbackPricing[skuCode as keyof typeof fallbackPricing] || { amount_cents: 0, formatted_amount: "£0.00" }
  }
}
