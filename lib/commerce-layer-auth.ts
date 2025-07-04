export async function getCommerceLayerAccessToken(
  clientId: string,
  clientSecret: string,
  scope?: string,
): Promise<string> {
  try {
    console.log("🔑 Requesting Commerce Layer access token...")
    console.log("📋 Client ID:", clientId.substring(0, 20) + "...")

    // Use provided scope or fall back to environment variable
    const tokenScope = scope || process.env.NEXT_PUBLIC_CL_SCOPE || `market:id:${process.env.NEXT_PUBLIC_CL_MARKET_ID}`

    console.log("🔧 Using scope:", tokenScope)

    const tokenUrl = `${process.env.COMMERCE_LAYER_BASE_URL}/oauth/token`
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: tokenScope,
    }

    console.log("📤 Token request payload:", {
      grant_type: tokenPayload.grant_type,
      client_id: tokenPayload.client_id.substring(0, 20) + "...",
      client_secret: "***",
      scope: tokenPayload.scope,
    })

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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token request failed:", tokenResponse.status, errorText)

      // Try to parse error response
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
        console.error("❌ Parsed error details:", JSON.stringify(errorDetails, null, 2))
      } catch {
        console.error("❌ Raw error text:", errorText)
      }

      // Provide specific error messages for common issues
      if (tokenResponse.status === 403) {
        throw new Error(
          `Authentication failed (403): Invalid client credentials or scope. Check your Integration App settings in Commerce Layer dashboard.`,
        )
      } else if (tokenResponse.status === 401) {
        throw new Error(`Unauthorized (401): Invalid client ID or secret.`)
      } else {
        throw new Error(`Token request failed: ${tokenResponse.status} ${errorText}`)
      }
    }

    const tokenData = await tokenResponse.json()
    console.log("✅ Access token obtained successfully")
    console.log("📊 Token type:", tokenData.token_type)
    console.log("⏰ Expires in:", tokenData.expires_in, "seconds")
    console.log("🔑 Token scope:", tokenData.scope)

    return tokenData.access_token
  } catch (error) {
    console.error("❌ Commerce Layer authentication failed:", error)
    throw error
  }
}
