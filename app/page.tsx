"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Star, Clock, Shield, Zap, MessageCircle, CreditCard } from "lucide-react"
import Image from "next/image"

const features = [
  {
    icon: MapPin,
    title: "Prime Locations",
    description: "Find parking spaces in the most convenient locations across the city",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "All parking spaces are verified and monitored for your peace of mind",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Book your parking space in seconds with our streamlined process",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock customer support for all your parking needs",
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Business Professional",
    content: "ParkPal has made my daily commute so much easier. I can always find a spot near my office!",
    rating: 5,
    avatar: "/placeholder-user.jpg",
  },
  {
    name: "Mike Chen",
    role: "Frequent Traveler",
    content: "Perfect for airport parking. Reliable, secure, and much cheaper than traditional lots.",
    rating: 5,
    avatar: "/placeholder-user.jpg",
  },
  {
    name: "Emma Davis",
    role: "City Resident",
    content: "The app is intuitive and the booking process is seamless. Highly recommend!",
    rating: 5,
    avatar: "/placeholder-user.jpg",
  },
]

export default function HomePage() {
  const [searchLocation, setSearchLocation] = useState("")

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/parkpal-logo-clean.png" alt="ParkPal" width={120} height={40} className="h-8 w-auto" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">
                Find Parking
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                How it Works
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                Support
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/reserve">
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Test Reserve
                </Button>
              </Link>
              <Button size="sm">Sign In</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Perfect Parking
              <span className="text-blue-600 block">Anywhere, Anytime</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Skip the stress of searching for parking. Book verified spaces in advance and arrive with confidence
              knowing your spot is waiting.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Enter location (e.g., Downtown, Airport, Mall)"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Link href="/chat">
                  <Button size="lg" className="h-12 px-8">
                    <Search className="h-5 w-5 mr-2" />
                    Find Parking
                  </Button>
                </Link>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/chat">
                <Button size="lg" className="w-full sm:w-auto">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Try AI Assistant
                </Button>
              </Link>
              <Link href="/reserve">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Test Booking Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ParkPal?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make parking simple, secure, and stress-free with cutting-edge technology and a network of verified
              parking spaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get parked in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Search & Compare</h3>
              <p className="text-gray-600">
                Enter your destination and browse available parking spaces with real-time pricing and availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Book & Pay</h3>
              <p className="text-gray-600">
                Select your preferred space, choose your duration, and complete your booking with secure payment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Park & Go</h3>
              <p className="text-gray-600">
                Arrive at your reserved space, park with confidence, and enjoy your destination worry-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Join thousands of satisfied parkers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Never Circle for Parking Again?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join ParkPal today and experience the future of parking. Book your first space and see why thousands trust
            us daily.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Finding Parking
              </Button>
            </Link>
            <Link href="/reserve">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Test Booking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/parkpal-logo-clean.png"
                alt="ParkPal"
                width={120}
                height={40}
                className="h-8 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400">Making parking simple, secure, and stress-free for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/chat" className="hover:text-white">
                    Find Parking
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/reserve" className="hover:text-white">
                    Test Booking
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ParkPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
