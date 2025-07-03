export async function getCommerceLayerAccessToken(
  clientId: string,
  clientSecret: string,
  marketId: string,
  stockLocationId?: string,
): Promise<string> {
  console.log("🔑 Requesting Commerce Layer access token...")

  const tokenUrl = "https://auth.commercelayer.io/oauth/token"

  // Construct scope string safely from raw IDs
  let scope = `market:id:${marketId}`
  if (stockLocationId) {
    scope += ` stock_location:id:${stockLocationId}`
  }

  console.log("🔑 Token request details:", {
    tokenUrl,
    scope,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdPrefix: clientId?.substring(0, 10) + "...",
    marketId,
    stockLocationId: stockLocationId || "not_used",
  })

  const tokenPayload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(tokenPayload),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("❌ Commerce Layer Auth Error:", error)
    throw new Error(`Commerce Layer auth failed: ${error?.errors?.[0]?.detail ?? response.statusText}`)
  }

  const data = await response.json()
  console.log("✅ Access token obtained successfully")

  return data.access_token
}
