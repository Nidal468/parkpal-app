import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debugging Commerce Layer Environment Variables")

    // Get all Commerce Layer environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Analyze the stock location ID
    const stockLocationAnalysis = clStockLocationId
      ? {
          raw: clStockLocationId,
          length: clStockLocationId.length,
          hasPrefix: clStockLocationId.startsWith("stock_location:id:"),
          prefixCount: (clStockLocationId.match(/stock_location:id:/g) || []).length,
          actualId: clStockLocationId.replace(/^stock_location:id:/, ""),
          wouldCauseDuplicate: clStockLocationId.startsWith("stock_location:id:"),
        }
      : null

    // Generate scope both ways to show the difference
    const scopeOldWay = clStockLocationId
      ? `market:id:${clMarketId} stock_location:id:${clStockLocationId}`
      : `market:id:${clMarketId}`

    const scopeNewWay = clStockLocationId
      ? `market:id:${clMarketId} ${clStockLocationId.startsWith("stock_location:id:") ? clStockLocationId : `stock_location:id:${clStockLocationId}`}`
      : `market:id:${clMarketId}`

    return NextResponse.json({
      diagnosis: "Commerce Layer Environment Variables Analysis",
      environmentVariables: {
        COMMERCE_LAYER_CLIENT_ID: clClientId ? `${clClientId.substring(0, 10)}...` : "undefined",
        COMMERCE_LAYER_CLIENT_SECRET: clClientSecret ? "✅ Set" : "❌ Missing",
        COMMERCE_LAYER_BASE_URL: clBaseUrl || "❌ Missing",
        COMMERCE_LAYER_MARKET_ID: clMarketId || "❌ Missing",
        COMMERCE_LAYER_STOCK_LOCATION_ID: clStockLocationId || "Not set",
      },
      stockLocationAnalysis,
      scopeComparison: {
        oldWay: {
          scope: scopeOldWay,
          hasDuplicates: scopeOldWay.includes("stock_location:id:stock_location:id:"),
          explanation: "This was causing the 400 Bad Request error",
        },
        newWay: {
          scope: scopeNewWay,
          hasDuplicates: scopeNewWay.includes("stock_location:id:stock_location:id:"),
          explanation: "This should work correctly",
        },
      },
      recommendation: stockLocationAnalysis?.hasPrefix
        ? {
            issue: "Your COMMERCE_LAYER_STOCK_LOCATION_ID already contains the 'stock_location:id:' prefix",
            solution: "Update your environment variable to just the ID part",
            currentValue: clStockLocationId,
            shouldBe: stockLocationAnalysis.actualId,
            instructions: [
              "Go to your Vercel dashboard",
              "Navigate to your project settings > Environment Variables",
              `Change COMMERCE_LAYER_STOCK_LOCATION_ID from: ${clStockLocationId}`,
              `To: ${stockLocationAnalysis.actualId}`,
              "Redeploy your application",
            ],
          }
        : {
            status: "✅ Stock location ID format looks correct",
            explanation: "The environment variable contains just the ID without prefix",
          },
      nextSteps: stockLocationAnalysis?.hasPrefix
        ? [
            "1. Fix the COMMERCE_LAYER_STOCK_LOCATION_ID environment variable",
            "2. Remove the 'stock_location:id:' prefix from the environment variable",
            "3. Keep only the actual ID (e.g., 'okJbPuNbjk')",
            "4. Redeploy the application",
            "5. Test authentication again",
          ]
        : [
            "1. Environment variables look correct",
            "2. Test the authentication with the fixed scope logic",
            "3. If still failing, check Commerce Layer app configuration",
          ],
    })
  } catch (error) {
    console.error("❌ Environment debug failed:", error)
    return NextResponse.json(
      {
        error: "Environment debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
