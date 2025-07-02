import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    title: "🚀 Create New Commerce Layer Integration Application",
    currentIssue: {
      problem: "Your current Commerce Layer application credentials are invalid",
      evidence: [
        "403 Forbidden error with empty response",
        "Commerce Layer is completely rejecting the credentials",
        "This indicates the application doesn't exist or is misconfigured",
      ],
    },
    solution: {
      overview: "Create a brand new Integration application in Commerce Layer",
      steps: [
        {
          step: 1,
          title: "Access Commerce Layer Dashboard",
          action: "Go to https://dashboard.commercelayer.io",
          details: "Log in to your Commerce Layer account",
        },
        {
          step: 2,
          title: "Navigate to Applications",
          action: "Go to Settings → Applications",
          details: "This is where you manage your API applications",
        },
        {
          step: 3,
          title: "Create New Application",
          action: "Click 'New Application' button",
          details: "Start the application creation process",
        },
        {
          step: 4,
          title: "Choose Application Type",
          action: "Select 'Integration' (NOT Sales Channel)",
          details: "Integration apps have full API access for server-side operations",
          important: "Do NOT choose Sales Channel - it has limited permissions",
        },
        {
          step: 5,
          title: "Configure Application",
          action: "Fill in the application details",
          details: {
            name: "ParkPal Integration",
            role: "Integration",
            grantTypes: ["Client Credentials"],
            scopes: "Select your market (usually your market ID)",
          },
          important: "Make sure 'Client Credentials' grant type is enabled",
        },
        {
          step: 6,
          title: "Save and Copy Credentials",
          action: "Save the application and copy the credentials",
          details: "You'll get a Client ID and Client Secret",
          warning: "Copy these immediately - the secret won't be shown again",
        },
        {
          step: 7,
          title: "Update Vercel Environment Variables",
          action: "Go to Vercel Dashboard → Your Project → Settings → Environment Variables",
          details: "Replace ALL Commerce Layer variables with the new ones",
          variables: {
            COMMERCE_LAYER_CLIENT_ID: "<new_client_id_from_step_6>",
            COMMERCE_LAYER_CLIENT_SECRET: "<new_client_secret_from_step_6>",
            COMMERCE_LAYER_BASE_URL: "https://mr-peat-worldwide.commercelayer.io",
            COMMERCE_LAYER_MARKET_ID: "<your_market_id>",
            COMMERCE_LAYER_SCOPE: "market:<your_market_id>",
          },
        },
        {
          step: 8,
          title: "Remove Old Variables",
          action: "Delete any old or conflicting environment variables",
          details: "Remove these if they exist:",
          toRemove: [
            "NEXT_PUBLIC_CL_CLIENT_ID",
            "NEXT_PUBLIC_CL_CLIENT_SECRET",
            "NEXT_PUBLIC_CL_BASE_URL",
            "NEXT_PUBLIC_CL_MARKET_ID",
            "NEXT_PUBLIC_CL_SCOPE",
            "CL_CLIENT_ID",
            "CL_CLIENT_SECRET",
          ],
        },
        {
          step: 9,
          title: "Redeploy Application",
          action: "Trigger a new deployment in Vercel",
          details: "This ensures the new environment variables are loaded",
        },
        {
          step: 10,
          title: "Test New Setup",
          action: "Visit /api/commerce-layer/verify-new-setup",
          details: "This will verify your new Integration application works",
        },
      ],
    },
    troubleshooting: {
      commonIssues: [
        {
          issue: "Can't find Applications in dashboard",
          solution: "Look for Settings → Applications or API → Applications",
        },
        {
          issue: "Integration option not available",
          solution: "Make sure you have the right permissions in your Commerce Layer organization",
        },
        {
          issue: "Client Credentials not available",
          solution: "This is required - contact Commerce Layer support if not available",
        },
        {
          issue: "Don't know my market ID",
          solution: "Go to Settings → Markets in Commerce Layer dashboard",
        },
      ],
    },
    verification: {
      afterCreation: [
        "✅ Application shows as 'Integration' type",
        "✅ Client Credentials grant type is enabled",
        "✅ Application has access to your market",
        "✅ You have copied both Client ID and Secret",
        "✅ Environment variables updated in Vercel",
        "✅ Application redeployed",
      ],
    },
    nextSteps: [
      "1. Follow the steps above to create a new Integration application",
      "2. Update your Vercel environment variables",
      "3. Redeploy your application",
      "4. Test with /api/commerce-layer/verify-new-setup",
      "5. If successful, test the full payment flow at /test-reserve",
    ],
    support: {
      message: "If you encounter issues creating the Integration application:",
      options: [
        "Check Commerce Layer documentation",
        "Contact Commerce Layer support",
        "Verify your account permissions",
      ],
    },
  })
}
