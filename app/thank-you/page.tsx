"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Download, MapPin, Car, Calendar, Mail, User } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getOrder } from "@/lib/commerce-layer"

interface OrderDetails {
  id: string
  status: string
  total: string
  currency: string
  customer_email: string
  line_items: Array<{
    id: string
    quantity: number
    unit_amount: string
    name: string
    metadata: {
      space_title?: string
      space_location?: string
      vehicle_registration?: string
      start_date?: string
      end_date?: string
      special_requests?: string
    }
  }>
  created_at: string
}

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId)
    } else {
      setError("No order ID provided")
      setLoading(false)
    }
  }, [orderId])

  const fetchOrderDetails = async (id: string) => {
    try {
      const order = await getOrder(id)
      setOrderDetails(order)
    } catch (err) {
      console.error("Error fetching order details:", err)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = () => {
    if (!orderDetails) return

    const receiptContent = `
PARKPAL BOOKING RECEIPT
======================

Order ID: ${orderDetails.id}
Date: ${format(new Date(orderDetails.created_at), "PPP")}
Status: ${orderDetails.status}

BOOKING DETAILS:
${orderDetails.line_items
  .map(
    (item) => `
- ${item.name}
  Quantity: ${item.quantity}
  Amount: ${item.unit_amount}
  Vehicle: ${item.metadata.vehicle_registration || "N/A"}
  Start: ${item.metadata.start_date ? format(new Date(item.metadata.start_date), "PPP") : "N/A"}
  End: ${item.metadata.end_date ? format(new Date(item.metadata.end_date), "PPP") : "N/A"}
`,
  )
  .join("")}

Total: ${orderDetails.total} ${orderDetails.currency.toUpperCase()}
Customer: ${orderDetails.customer_email}

Thank you for choosing ParkPal!
    `

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `parkpal-receipt-${orderDetails.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "We couldn't find your booking details."}</p>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lineItem = orderDetails.line_items[0] // Assuming single item for now

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your parking space has been successfully reserved.</p>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Summary</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {orderDetails.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order ID:</span>
                <p className="font-mono">{orderDetails.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Booking Date:</span>
                <p>{format(new Date(orderDetails.created_at), "PPP")}</p>
              </div>
            </div>

            <Separator />

            {/* Parking Space Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Parking Space
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{lineItem.metadata.space_title || "Parking Space"}</p>
                {lineItem.metadata.space_location && (
                  <p className="text-sm text-gray-600">{lineItem.metadata.space_location}</p>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Booking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <p>
                    {lineItem.metadata.start_date
                      ? format(new Date(lineItem.metadata.start_date), "PPP p")
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <p>
                    {lineItem.metadata.end_date
                      ? format(new Date(lineItem.metadata.end_date), "PPP p")
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p>{lineItem.quantity} unit(s)</p>
                </div>
                <div>
                  <span className="text-gray-500">Rate:</span>
                  <p>{lineItem.unit_amount}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            {lineItem.metadata.vehicle_registration && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehicle Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-mono text-lg">{lineItem.metadata.vehicle_registration}</p>
                </div>
              </div>
            )}

            {/* Special Requests */}
            {lineItem.metadata.special_requests && (
              <div className="space-y-3">
                <h3 className="font-semibold">Special Requests</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">{lineItem.metadata.special_requests}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Paid:</span>
              <span className="text-green-600">
                {orderDetails.total} {orderDetails.currency.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{orderDetails.customer_email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Please arrive at your reserved time slot</li>
              <li>• Keep your vehicle registration visible</li>
              <li>• Contact support if you need to modify your booking</li>
              <li>• Save this confirmation for your records</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={downloadReceipt} variant="outline" className="flex-1 bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Link href="/" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700">Return to Home</Button>
          </Link>
        </div>

        {/* Support Contact */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Need help? Contact us at support@parkpal.com or call +44 20 1234 5678</p>
        </div>
      </div>
    </div>
  )
}
