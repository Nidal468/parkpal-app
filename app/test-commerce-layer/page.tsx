"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle, Play, Database, MapPin } from "lucide-react"

interface TestResult {
  success: boolean
  timestamp: string
  tests?: {
    spaceMapping: any
    orderCreation: any
    database: any
  }
  overallSuccess?: boolean
  error?: string
}

interface ManualTestResult {
  success: boolean
  orderData: any
  bookingRecord: any
  message: string
  timestamp: string
}

export default function TestCommerceLayerPage() {
  const [isRunningFullTest, setIsRunningFullTest] = useState(false)
  const [fullTestResult, setFullTestResult] = useState<TestResult | null>(null)

  const [isRunningManualTest, setIsRunningManualTest] = useState(false)
  const [manualTestResult, setManualTestResult] = useState<ManualTestResult | null>(null)

  const [manualTestForm, setManualTestForm] = useState({
    sku: "parking-hour",
    customerName: "Test User",
    customerEmail: "test@example.com",
  })

  const runFullTest = async () => {
    setIsRunningFullTest(true)
    setFullTestResult(null)

    try {
      const response = await fetch("/api/test-commerce-layer-flow")
      const result = await response.json()
      setFullTestResult(result)
    } catch (error) {
      setFullTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Test failed",
      })
    } finally {
      setIsRunningFullTest(false)
    }
  }

  const runManualTest = async () => {
    setIsRunningManualTest(true)
    setManualTestResult(null)

    try {
      const response = await fetch("/api/manual-test-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manualTestForm),
      })
      const result = await response.json()
      setManualTestResult(result)
    } catch (error) {
      setManualTestResult({
        success: false,
        orderData: null,
        bookingRecord: null,
        message: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsRunningManualTest(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commerce Layer Integration Test</h1>
        <p className="text-muted-foreground">Test the Commerce Layer integration with hardcoded space UUIDs</p>
      </div>

      <Tabs defaultValue="full-test" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="full-test">Full Test Suite</TabsTrigger>
          <TabsTrigger value="manual-test">Manual Test</TabsTrigger>
          <TabsTrigger value="space-mapping">Space Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="full-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Full Test Suite
              </CardTitle>
              <CardDescription>
                Tests space mapping, order creation for all SKUs, and database insertion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runFullTest} disabled={isRunningFullTest} className="w-full">
                {isRunningFullTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Full Test Suite"
                )}
              </Button>

              {fullTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {fullTestResult.overallSuccess ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {fullTestResult.overallSuccess ? "All Tests Passed" : "Some Tests Failed"}
                    </span>
                    <Badge variant={fullTestResult.overallSuccess ? "default" : "destructive"}>
                      {fullTestResult.timestamp}
                    </Badge>
                  </div>

                  {fullTestResult.tests && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Space Mapping
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant={fullTestResult.tests.spaceMapping.success ? "default" : "destructive"}>
                            {fullTestResult.tests.spaceMapping.success ? "PASS" : "FAIL"}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Order Creation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant={fullTestResult.tests.orderCreation.success ? "default" : "destructive"}>
                            {fullTestResult.tests.orderCreation.successCount}/
                            {fullTestResult.tests.orderCreation.totalCount}
                          </Badge>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Database
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant={fullTestResult.tests.database.success ? "default" : "destructive"}>
                            {fullTestResult.tests.database.success ? "PASS" : "FAIL"}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <details className="border rounded p-4">
                    <summary className="cursor-pointer font-medium">View Detailed Results</summary>
                    <pre className="mt-4 text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(fullTestResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Order Test</CardTitle>
              <CardDescription>Create a single test order with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU Type</Label>
                  <Select
                    value={manualTestForm.sku}
                    onValueChange={(value) => setManualTestForm((prev) => ({ ...prev, sku: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parking-hour">Hourly Parking</SelectItem>
                      <SelectItem value="parking-day">Daily Parking</SelectItem>
                      <SelectItem value="parking-month">Monthly Parking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={manualTestForm.customerName}
                    onChange={(e) => setManualTestForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={manualTestForm.customerEmail}
                  onChange={(e) => setManualTestForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                />
              </div>

              <Button onClick={runManualTest} disabled={isRunningManualTest} className="w-full">
                {isRunningManualTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  "Create Test Order"
                )}
              </Button>

              {manualTestResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {manualTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{manualTestResult.message}</span>
                  </div>

                  {manualTestResult.success && manualTestResult.orderData && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <strong>Order ID:</strong> {manualTestResult.orderData.orderId}
                          </div>
                          <div>
                            <strong>Space ID:</strong> {manualTestResult.orderData.spaceId}
                          </div>
                          <div>
                            <strong>Customer ID:</strong> {manualTestResult.orderData.customerId}
                          </div>
                          <div>
                            <strong>Amount:</strong> £{manualTestResult.orderData.amount}
                          </div>
                        </CardContent>
                      </Card>

                      {manualTestResult.bookingRecord && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Database Record</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <strong>Booking ID:</strong> {manualTestResult.bookingRecord.id}
                            </div>
                            <div>
                              <strong>Status:</strong> {manualTestResult.bookingRecord.status}
                            </div>
                            <div>
                              <strong>Vehicle:</strong> {manualTestResult.bookingRecord.vehicle_registration}
                            </div>
                            <div>
                              <strong>Created:</strong>{" "}
                              {new Date(manualTestResult.bookingRecord.created_at).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <details className="border rounded p-4">
                    <summary className="cursor-pointer font-medium">View Raw Response</summary>
                    <pre className="mt-4 text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(manualTestResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="space-mapping">
          <Card>
            <CardHeader>
              <CardTitle>Space UUID Mapping</CardTitle>
              <CardDescription>View the hardcoded space UUIDs and their mappings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Hourly Parking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted p-2 rounded block">5a4addb0-e463-49c9-9c18-74a25e29127b</code>
                      <Badge className="mt-2">parking-hour</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Daily Parking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted p-2 rounded block">73bef0f1-d91c-49b4-9520-dcf43f976250</code>
                      <Badge className="mt-2">parking-day</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Parking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted p-2 rounded block">9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd</code>
                      <Badge className="mt-2">parking-month</Badge>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={() => window.open("/api/commerce-layer/get-test-spaces", "_blank")}
                  variant="outline"
                  className="w-full"
                >
                  View Live Space Mapping API
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
