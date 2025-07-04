import { NextResponse } from "next/server"
import { DeployedDemoStoreIntegration } from "@/lib/deployed-demo-store-integration"
import { testCommerceLayerConnection } from "@/lib/commerce-layer-auth"
import { CL_CONFIG, PARKPAL_SKUS, DEMO_STORE_CONFIG } from "@/lib/commerce-layer-config"

export async function GET() {
  try {
    console.log("🔍 Verifying deployed demo-store-core integration...")
    console.log("🌐 Backend URL:", DEMO_STORE_CONFIG.BASE_URL)

    const deployedDemoStore = new DeployedDemoStoreIntegration()

    // Get comprehensive status
    const status = await deployedDemoStore.getStatus()

    // Test Commerce Layer connection separately
    const clConnectionTest = await testCommerceLayerConnection()

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_CL_CLIENT_ID: !!process.env.NEXT_PUBLIC_CL_CLIENT_ID,
      NEXT_PUBLIC_CL_CLIENT_SECRET: !!(
        process.env.NEXT_PUBLIC_CL_CLIENT_SECRET || process.env.COMMERCE_LAYER_CLIENT_SECRET
      ),
      NEXT_PUBLIC_CL_MARKET_ID: !!process.env.NEXT_PUBLIC_CL_MARKET_ID,
      NEXT_PUBLIC_CL_STOCK_LOCATION_ID: !!process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
      COMMERCE_LAYER_BASE_URL: !!process.env.COMMERCE_LAYER_BASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    const configCheck = {
      baseUrl: CL_CONFIG.BASE_URL,
      clientIdPresent: !!CL_CONFIG.CLIENT_ID,
      clientSecretPresent: !!CL_CONFIG.CLIENT_SECRET,
      marketIdPresent: !!CL_CONFIG.MARKET_ID,
      stockLocationIdPresent: !!CL_CONFIG.STOCK_LOCATION_ID,
      scope: CL_CONFIG.SCOPE,
      deployedBackend: DEMO_STORE_CONFIG.BASE_URL,
      deployedApiBase: DEMO_STORE_CONFIG.API_BASE,
    }

    // Determine next steps
    const nextSteps = []
    if (!status.commerceLayer.authenticated) {
      nextSteps.push("❌ Fix Commerce Layer authentication - check CLIENT_ID and CLIENT_SECRET")
    }
    if (!status.skus.verified) {
      nextSteps.push("❌ Verify SKUs exist in Commerce Layer dashboard")
    }
    if (!status.backend.connected) {
      nextSteps.push("⚠️ Backend connection failed - using Commerce Layer fallback")
    }
    if (status.overall === "READY") {
      nextSteps.push("✅ Integration is ready!")
      nextSteps.push("Test booking via /api/parkpal/deployed-booking")
    }

    return NextResponse.json({
      success: true,
      message: "Deployed demo-store-core integration verification complete",
      timestamp: new Date().toISOString(),
      deployedBackend: {
        url: DEMO_STORE_CONFIG.BASE_URL,
        apiBase: DEMO_STORE_CONFIG.API_BASE,
        connected: status.backend.connected,
        error: status.backend.error,
      },
      commerceLayer: {
        authenticated: status.commerceLayer.authenticated,
        connectionTest: clConnectionTest,
        error: status.commerceLayer.error,
      },
      skus: {
        verified: status.skus.verified,
        results: status.skus.results,
        errors: status.skus.errors,
        parkpalSKUs: PARKPAL_SKUS,
      },
      environment: {
        variables: envCheck,
        config: configCheck,
      },
      integration: {
        status: status.overall,
        ready: status.overall === "READY",
        partial: status.overall === "PARTIAL",
        failed: status.overall === "FAILED",
      },
      nextSteps,
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
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
