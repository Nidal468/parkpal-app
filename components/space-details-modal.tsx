"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Star, Clock, Shield, Car, Wifi, Camera, Phone, Mail, User, Calendar } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
}

interface SpaceDetailsModalProps {
  space: any
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [isBooking, setIsBooking] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    userName: "",
    userEmail: "",
    userPhone: "",
    vehicleRegistration: "",
    startDate: "",
    endDate: "",
  })

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && space?.id) {
      fetchReviews()
    }
  }, [isOpen, space?.id])

  const fetchReviews = async () => {
    setLoadingReviews(true)
    try {
      const response = await fetch(`/api/reviews?space_id=${space.id}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      } else {
        console.error("Failed to fetch reviews")
        // Fallback to mock data
        setReviews([
          {
            id: "1",
            rating: 5,
            comment: "Excellent parking space! Very secure and convenient location.",
            created_at: "2024-01-20T10:30:00Z",
          },
          {
            id: "2",
            rating: 4,
            comment: "Good value for money. Easy access and well-lit area.",
            created_at: "2024-01-18T14:20:00Z",
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      // Fallback to mock data
      setReviews([
        {
          id: "1",
          rating: 5,
          comment: "Excellent parking space! Very secure and convenient location.",
          created_at: "2024-01-20T10:30:00Z",
        },
        {
          id: "2",
          rating: 4,
          comment: "Good value for money. Easy access and well-lit area.",
          created_at: "2024-01-18T14:20:00Z",
        },
      ])
    } finally {
      setLoadingReviews(false)
    }
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBooking(true)

    try {
      const startDate = new Date(bookingForm.startDate)
      const endDate = new Date(bookingForm.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const totalPrice = days * (space.price_per_day || space.price || 15)

      const bookingData = {
        spaceId: space.id,
        userName: bookingForm.userName,
        userEmail: bookingForm.userEmail,
        userPhone: bookingForm.userPhone,
        vehicleRegistration: bookingForm.vehicleRegistration,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        totalPrice,
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        const result = await response.json()
        alert("Booking confirmed! You will receive a confirmation email shortly.")
        onClose()
        setBookingForm({
          userName: "",
          userEmail: "",
          userPhone: "",
          vehicleRegistration: "",
          startDate: "",
          endDate: "",
        })
      } else {
        const error = await response.json()
        alert(`Booking failed: ${error.error || "Please try again"}`)
      }
    } catch (error) {
      console.error("Booking error:", error)
      alert("Booking failed. Please try again.")
    } finally {
      setIsBooking(false)
    }
  }

  if (!space) return null

  const features = Array.isArray(space.features) ? space.features : space.features?.split(",") || []
  const availableSpaces = space.available_spaces || space.total_spaces - (space.booked_spaces || 0) || 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{space.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {space.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img
                src={space.image_url || "/placeholder.svg"}
                alt={space.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{space.address || space.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{availableSpaces} spaces available</span>
            </div>
          </div>

          {/* Price and Rating */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold">£{space.price_per_day || space.price || 15}</span>
              <span className="text-gray-500">/day</span>
              {space.monthly_price && <div className="text-sm text-gray-600">£{space.monthly_price}/month</div>}
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{calculateAverageRating()}</span>
              <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {features.map((feature: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature.toLowerCase().includes("security") && <Shield className="h-3 w-3" />}
                    {feature.toLowerCase().includes("cctv") && <Camera className="h-3 w-3" />}
                    {feature.toLowerCase().includes("wifi") && <Wifi className="h-3 w-3" />}
                    {feature.toLowerCase().includes("24/7") && <Clock className="h-3 w-3" />}
                    {feature.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {space.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{space.description}</p>
            </div>
          )}

          <Separator />

          {/* Reviews Section */}
          <div>
            <h3 className="font-semibold mb-4">Reviews ({reviews.length})</h3>
            {loadingReviews ? (
              <div className="text-center py-4">Loading reviews...</div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>

          <Separator />

          {/* Booking Form */}
          <div>
            <h3 className="font-semibold mb-4">Book This Space</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="userName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={bookingForm.userName}
                      onChange={(e) => setBookingForm({ ...bookingForm, userName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      value={bookingForm.userEmail}
                      onChange={(e) => setBookingForm({ ...bookingForm, userEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="userPhone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      className="pl-10"
                      value={bookingForm.userPhone}
                      onChange={(e) => setBookingForm({ ...bookingForm, userPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vehicleRegistration">Vehicle Registration</Label>
                  <div className="relative">
                    <Car className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="vehicleRegistration"
                      type="text"
                      placeholder="AB12 CDE"
                      className="pl-10"
                      value={bookingForm.vehicleRegistration}
                      onChange={(e) => setBookingForm({ ...bookingForm, vehicleRegistration: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      className="pl-10"
                      value={bookingForm.startDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="endDate"
                      type="date"
                      className="pl-10"
                      value={bookingForm.endDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                      min={bookingForm.startDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBooking}>
                  {isBooking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
