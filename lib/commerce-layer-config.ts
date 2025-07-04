// Commerce Layer configuration for Parkpal integration with deployed demo-store-core
export const CL_CONFIG = {
  BASE_URL: process.env.COMMERCE_LAYER_BASE_URL || "https://mr-peat-worldwide.commercelayer.io",
  CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID!,
  CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!,
  MARKET_ID: process.env.NEXT_PUBLIC_CL_MARKET_ID!,
  STOCK_LOCATION_ID: process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID!,
  SCOPE: "market:all",
}

// Your deployed demo-store-core backend
export const DEMO_STORE_CONFIG = {
  BASE_URL: "https://park-pal-core-website-prnz.vercel.app",
  API_BASE: "https://park-pal-core-website-prnz.vercel.app/api",
}

// Your specific Parkpal SKUs from Commerce Layer
export const PARKPAL_SKUS = {
  HOUR: {
    id: "nOpOSOOmjP",
    code: "parking-hour",
    name: "Hourly Parking",
    price: 5.0,
    description: "Pay-per-hour parking space",
  },
  DAY: {
    id: "nzPQSQQljQ",
    code: "parking-day",
    name: "Daily Parking",
    price: 25.0,
    description: "Full day parking space",
  },
  MONTH: {
    id: "ZrxeSjjmvm",
    code: "parking-month",
    name: "Monthly Parking",
    price: 200.0,
    description: "Monthly parking subscription",
  },
} as const

// Demo store core API endpoints (following the standard structure)
export const DEMO_STORE_ENDPOINTS = {
  // Standard Commerce Layer endpoints via your deployed backend
  CUSTOMERS: "/customers",
  ORDERS: "/orders",
  LINE_ITEMS: "/line_items",
  SKUS: "/skus",
  PRICES: "/prices",
  STOCK_ITEMS: "/stock_items",
  MARKETS: "/markets",
  PAYMENT_METHODS: "/payment_methods",

  // Checkout and payment
  CHECKOUT: "/checkout",
  PAYMENT_SOURCES: "/payment_sources",

  // Parkpal specific endpoints (if you've added them to your fork)
  PARKING_BOOKINGS: "/parking/bookings",
  PARKING_SPACES: "/parking/spaces",
  PARKING_AVAILABILITY: "/parking/availability",
}

// Map SKUs to parking space types for metadata
export const SKU_TO_SPACE_MAP = {
  "parking-hour": "hourly-space",
  "parking-day": "daily-space",
  "parking-month": "monthly-space",
} as const
