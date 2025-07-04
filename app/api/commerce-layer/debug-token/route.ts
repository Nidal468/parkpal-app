import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debugging Commerce Layer token request...")

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const scope = process.env.NEXT_PUBLIC_CL_SCOPE
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL

    console.log("📋 Environment variables check:")
    console.log("- Client ID:", clientId ? `${clientId.substring(0, 20)}...` : "❌ MISSING")
    console.log("- Client Secret:", clientSecret ? `${clientSecret.substring(0, 10)}...` : "❌ MISSING")
    console.log("- Scope:", scope || "❌ MISSING")
    console.log("- Base URL:", baseUrl || "❌ MISSING")

    if (!clientId || !clientSecret || !scope || !baseUrl) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
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

    const tokenUrl = `${baseUrl}/oauth/token`
    console.log("🔗 Token URL:", tokenUrl)

    const requestBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
    })

    console.log("📤 Request body:", requestBody.toString())

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: requestBody,
    })

    console.log("📡 Response status:", response.status)
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📡 Response body:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      request: {
        url: tokenUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: requestBody.toString(),
      },
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      },
      environment: {
        clientId: clientId ? `${clientId.substring(0, 20)}...` : null,
        clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : null,
        scope: scope,
        baseUrl: baseUrl,
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
