import { NextResponse } from "next/server"
import { DeployedDemoStoreIntegration } from "@/lib/deployed-demo-store-integration"
import { CL_CONFIG, PARKPAL_SKUS, DEMO_STORE_CONFIG } from "@/lib/commerce-layer-config"

export async function GET() {
  try {
    console.log("🔍 Verifying deployed demo-store-core integration...")
    console.log("🌐 Backend URL:", DEMO_STORE_CONFIG.BASE_URL)

    const deployedDemoStore = new DeployedDemoStoreIntegration()

    // Test 1: Backend connection
    console.log("📡 Testing backend connection...")
    const backendConnected = await deployedDemoStore.testBackendConnection()

    // Test 2: Backend status
    console.log("📊 Getting backend status...")
    const backendStatus = await deployedDemoStore.getBackendStatus()

    // Test 3: Verify SKUs exist
    console.log("📦 Testing SKU verification...")
    const skusValid = await deployedDemoStore.verifyParkpalSKUs()

    // Test 4: Check configuration
    const configCheck = {
      baseUrl: CL_CONFIG.BASE_URL,
      hasClientId: !!CL_CONFIG.CLIENT_ID,
      hasClientSecret: !!CL_CONFIG.CLIENT_SECRET,
      hasMarketId: !!CL_CONFIG.MARKET_ID,
      scope: CL_CONFIG.SCOPE,
      deployedBackend: DEMO_STORE_CONFIG.BASE_URL,
      deployedApiBase: DEMO_STORE_CONFIG.API_BASE,
    }

    // Test 5: Test access token generation
    let tokenTest = false
    try {
      const integration = new DeployedDemoStoreIntegration()
      await (integration as any).getAccessToken()
      tokenTest = true
      console.log("✅ Access token generation successful")
    } catch (error) {
      console.error("❌ Access token generation failed:", error)
    }

    const integrationStatus = backendConnected && skusValid && tokenTest ? "READY" : "NEEDS_SETUP"

    return NextResponse.json({
      success: true,
      message: "Deployed demo-store-core integration verification",
      deployedBackend: {
        url: DEMO_STORE_CONFIG.BASE_URL,
        apiBase: DEMO_STORE_CONFIG.API_BASE,
        connected: backendConnected,
        status: backendStatus,
      },
      results: {
        backendConnected,
        skusValid,
        tokenTest,
        configCheck,
        parkpalSKUs: PARKPAL_SKUS,
        integrationStatus,
      },
      nextSteps:
        integrationStatus === "READY"
          ? ["✅ Integration is ready!", "Test booking via /api/parkpal/deployed-booking"]
          : [
              "❌ Setup required:",
              !backendConnected && "- Check deployed backend is accessible",
              !skusValid && "- Verify SKUs exist in Commerce Layer",
              !tokenTest && "- Check Commerce Layer credentials",
            ].filter(Boolean),
    })
  } catch (error) {
    console.error("❌ Deployed demo store verification failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Verification failed",
        deployedBackend: {
          url: DEMO_STORE_CONFIG.BASE_URL,
          connected: false,
        },
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
