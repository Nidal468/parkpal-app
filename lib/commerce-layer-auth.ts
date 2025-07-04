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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token request failed:", tokenResponse.status, errorText)
      throw new Error(`Token request failed: ${tokenResponse.status} ${errorText}`)
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
