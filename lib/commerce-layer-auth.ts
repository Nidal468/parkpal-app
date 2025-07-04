// Fixed Commerce Layer authentication with proper error handling
export async function getCommerceLayerAccessToken(
  clientId: string,
  clientSecret: string,
  scope = "market:all",
): Promise<string> {
  console.log("🔐 Getting Commerce Layer access token...")
  console.log("📋 Config:", {
    clientId: clientId ? `${clientId.substring(0, 8)}...` : "MISSING",
    clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : "MISSING",
    scope,
  })

  // Validate required credentials
  if (!clientId || !clientSecret) {
    throw new Error("Missing Commerce Layer credentials: CLIENT_ID or CLIENT_SECRET not provided")
  }

  // Validate credential format
  if (typeof clientId !== "string" || typeof clientSecret !== "string") {
    throw new Error("Invalid Commerce Layer credentials: must be strings")
  }

  if (clientId.length < 10 || clientSecret.length < 10) {
    throw new Error("Invalid Commerce Layer credentials: too short")
  }

  try {
    const tokenUrl = "https://auth.commercelayer.io/oauth/token"

    const requestBody = {
      grant_type: "client_credentials",
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      scope: scope.trim(),
    }

    console.log("🌐 Making token request to:", tokenUrl)
    console.log("📝 Request body:", {
      grant_type: requestBody.grant_type,
      client_id: `${requestBody.client_id.substring(0, 8)}...`,
      client_secret: `${requestBody.client_secret.substring(0, 8)}...`,
      scope: requestBody.scope,
    })

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Token response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Token request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })

      // Parse error details if available
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.error_description || errorJson.error || errorText
      } catch (e) {
        // Keep original error text if not JSON
      }

      throw new Error(`Commerce Layer authentication failed (${response.status}): ${errorDetails}`)
    }

    const tokenData = await response.json()
    console.log("✅ Token received:", {
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "MISSING",
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
    })

    if (!tokenData.access_token) {
      throw new Error("No access token in response")
    }

    // Validate token format
    if (typeof tokenData.access_token !== "string" || tokenData.access_token.length < 10) {
      throw new Error("Invalid access token format received")
    }

    return tokenData.access_token
  } catch (error) {
    console.error("❌ Commerce Layer authentication error:", error)

    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(`Commerce Layer authentication failed: ${String(error)}`)
    }
  }
}

// Test Commerce Layer connection
export async function testCommerceLayerConnection(): Promise<{
  success: boolean
  error?: string
  token?: string
}> {
  try {
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET || process.env.COMMERCE_LAYER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: "Missing environment variables: NEXT_PUBLIC_CL_CLIENT_ID or NEXT_PUBLIC_CL_CLIENT_SECRET",
      }
    }

    const token = await getCommerceLayerAccessToken(clientId, clientSecret)

    return {
      success: true,
      token: `${token.substring(0, 20)}...`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
