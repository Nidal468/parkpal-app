import { NextResponse } from "next/server"
import { DemoStoreIntegration } from "@/lib/demo-store-integration"
import { CL_CONFIG, PARKPAL_SKUS, DEMO_STORE_ENDPOINTS } from "@/lib/commerce-layer-config"

export async function GET() {
  try {
    console.log("🔍 Verifying demo-store-core integration...")

    const demoStore = new DemoStoreIntegration()

    // Test 1: Verify SKUs exist
    console.log("📦 Testing SKU verification...")
    const skusValid = await demoStore.verifyParkpalSKUs()

    // Test 2: Check configuration
    const configCheck = {
      baseUrl: CL_CONFIG.BASE_URL,
      hasClientId: !!CL_CONFIG.CLIENT_ID,
      hasClientSecret: !!CL_CONFIG.CLIENT_SECRET,
      hasMarketId: !!CL_CONFIG.MARKET_ID,
      scope: CL_CONFIG.SCOPE,
      demoStoreRepo: "https://github.com/MRPEATWORLWIDE/park-pal-core",
      apiEndpoints: DEMO_STORE_ENDPOINTS,
    }

    // Test 3: Test access token generation
    let tokenTest = false
    try {
      const integration = new DemoStoreIntegration()
      await (integration as any).getAccessToken()
      tokenTest = true
      console.log("✅ Access token generation successful")
    } catch (error) {
      console.error("❌ Access token generation failed:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Demo-store-core integration verification",
      results: {
        skusValid,
        tokenTest,
        configCheck,
        parkpalSKUs: PARKPAL_SKUS,
        integrationStatus: skusValid && tokenTest ? "READY" : "NEEDS_SETUP",
      },
    })
  } catch (error) {
    console.error("❌ Demo store verification failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Verification failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
