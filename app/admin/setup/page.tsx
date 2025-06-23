"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function DatabaseSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const setupDatabase = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Setup failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🚗 Parkpal Database Setup</CardTitle>
            <CardDescription>
              Click the button below to insert real parking spaces into your Supabase database. This will add 5 real
              SE17/SE1 parking spaces with host information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={setupDatabase} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up database...
                </>
              ) : (
                <>🚀 Setup Database with Real Parking Spaces</>
              )}
            </Button>

            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">{result.message}</p>
                    <ul className="text-sm space-y-1">
                      <li>• Spaces inserted: {result.spacesInserted}</li>
                      <li>• Hosts inserted: {result.hostsInserted}</li>
                      <li>• Total spaces in DB: {result.totalSpacesInDB}</li>
                    </ul>
                    <p className="text-sm font-medium mt-3">
                      ✅ Your chat should now show real parking spaces! Try: "Need parking near SE17"
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <p className="font-semibold">Setup failed:</p>
                  <p className="text-sm mt-1">{error}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>What this does:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Creates 8 host users in your database</li>
                <li>Inserts 5 real parking spaces in SE17/SE1 areas</li>
                <li>Uses real London addresses and postcodes</li>
                <li>Sets realistic prices (£12-25/day)</li>
                <li>Makes all spaces available and bookable</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
