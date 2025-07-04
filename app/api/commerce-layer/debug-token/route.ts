import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debugging Commerce Layer token generation...")

    // Check environment variables
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const scope = process.env.NEXT_PUBLIC_CL_SCOPE
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL

    console.log("📋 Environment Variables Check:")
    console.log("- NEXT_PUBLIC_CL_CLIENT_ID:", clientId ? `${clientId.substring(0, 20)}...` : "❌ MISSING")
    console.log("- NEXT_PUBLIC_CL_CLIENT_SECRET:", clientSecret ? "✅ Present" : "❌ MISSING")
    console.log("- NEXT_PUBLIC_CL_SCOPE:", scope || "❌ MISSING")
    console.log("- COMMERCE_LAYER_BASE_URL:", baseUrl || "❌ MISSING")

    if (!clientId || !clientSecret || !scope || !baseUrl) {
      return NextResponse.json(
        {
          error: "Missing required environment variables",
          missing: {
            clientId: !clientId,
            clientSecret: !clientSecret,
            scope: !scope,
            baseUrl: !baseUrl,
          },
        },
        { status: 500 },
      )
    }

    // Test token request
    const tokenUrl = `${baseUrl}/oauth/token`
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
    }

    console.log("📤 Token request details:")
    console.log("- URL:", tokenUrl)
    console.log("- Grant Type:", tokenPayload.grant_type)
    console.log("- Client ID:", tokenPayload.client_id.substring(0, 20) + "...")
    console.log("- Scope:", tokenPayload.scope)

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenPayload),
    })

    console.log("📥 Token response status:", tokenResponse.status)
    console.log("📥 Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    const responseText = await tokenResponse.text()
    console.log("📥 Token response body:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: tokenResponse.ok,
      status: tokenResponse.status,
      environment: {
        clientId: clientId.substring(0, 20) + "...",
        hasClientSecret: !!clientSecret,
        scope: scope,
        baseUrl: baseUrl,
      },
      request: {
        url: tokenUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        payload: {
          grant_type: tokenPayload.grant_type,
          client_id: tokenPayload.client_id.substring(0, 20) + "...",
          scope: tokenPayload.scope,
        },
      },
      response: {
        status: tokenResponse.status,
        headers: Object.fromEntries(tokenResponse.headers.entries()),
        data: responseData,
      },
    })
  } catch (error) {
    console.error("❌ Debug token error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Debug failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
