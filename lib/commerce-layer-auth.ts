export async function getCommerceLayerAccessToken(
  clientId: string,
  clientSecret: string,
  scope: string,
): Promise<string> {
  try {
    console.log("🔑 Requesting Commerce Layer access token...")
    console.log("- Client ID:", clientId.substring(0, 20) + "...")
    console.log("- Scope:", scope)

    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    if (!baseUrl) {
      throw new Error("COMMERCE_LAYER_BASE_URL is not configured")
    }

    const tokenUrl = `${baseUrl}/oauth/token`
    console.log("- Token URL:", tokenUrl)

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
      }),
    })

    console.log("📡 Token response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Token request failed:", response.status, errorText)
      throw new Error(`Token request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Token obtained successfully")

    return data.access_token
  } catch (error) {
    console.error("❌ Commerce Layer authentication failed:", error)
    throw error
  }
}
