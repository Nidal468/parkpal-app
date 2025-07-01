import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, MessageCircle, Car, Star, Clock, Shield, Zap } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/parkpal-logo-clean.png" alt="ParkPal" width={120} height={40} className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Find Parking
                </Button>
              </Link>
              <Link href="/reserve">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Car className="w-4 h-4 mr-2" />
                  Test Reserve
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find Perfect Parking with
            <span className="text-blue-600"> AI-Powered Search</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Skip the stress of finding parking. Our intelligent assistant helps you discover, compare, and book parking
            spaces instantly - whether you need a spot for an hour, a day, or a month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Parking Search
              </Button>
            </Link>
            <Link href="/reserve">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-transparent">
                <Car className="w-5 h-5 mr-2" />
                Test Commerce Layer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ParkPal?</h2>
            <p className="text-lg text-gray-600">Experience the future of parking with our innovative features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>AI Chat Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simply tell us where you need parking and our AI will find the perfect spots for you.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Interactive Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View available spaces on detailed maps with real-time availability updates.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Flexible Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Book parking by the hour, day, or month. Perfect for any schedule.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Safe and secure payments powered by Stripe and Commerce Layer integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get parked in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600">Tell our AI assistant where you need parking and when</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Compare</h3>
              <p className="text-gray-600">Browse available spaces with prices, ratings, and amenities</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Book</h3>
              <p className="text-gray-600">Reserve your spot instantly with secure payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Parking Spaces */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Parking Spaces</h2>
            <p className="text-lg text-gray-600">Discover premium parking locations in your area</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=300&text=Downtown+Garage"
                  alt="Downtown Parking"
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-2 right-2 bg-green-600">Available</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Downtown Premium
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">4.8</span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  123 Main Street, Downtown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">$8.50</span>
                  <span className="text-gray-600">/hour</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Covered</Badge>
                  <Badge variant="secondary">Security</Badge>
                  <Badge variant="secondary">EV Charging</Badge>
                </div>
                <Button className="w-full">View Details</Button>
              </CardContent>
            </Card>

            <Card>
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=300&text=Airport+Parking"
                  alt="Airport Parking"
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-2 right-2 bg-green-600">Available</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Airport Long-term
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">4.6</span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Airport Terminal 1
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">$12</span>
                  <span className="text-gray-600">/day</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Shuttle</Badge>
                  <Badge variant="secondary">24/7</Badge>
                  <Badge variant="secondary">Valet</Badge>
                </div>
                <Button className="w-full">View Details</Button>
              </CardContent>
            </Card>

            <Card>
              <div className="relative">
                <img
                  src="/placeholder.svg?height=200&width=300&text=Monthly+Parking"
                  alt="Monthly Parking"
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-2 right-2 bg-green-600">Available</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Business District
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">4.9</span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  456 Business Ave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">$280</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Reserved</Badge>
                  <Badge variant="secondary">Keycard</Badge>
                  <Badge variant="secondary">Wash</Badge>
                </div>
                <Button className="w-full">View Details</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Find Your Perfect Parking Spot?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of drivers who have simplified their parking experience with ParkPal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Your Search
              </Button>
            </Link>
            <Link href="/reserve">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <Zap className="w-5 h-5 mr-2" />
                Test Integration
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Image src="/parkpal-logo-clean.png" alt="ParkPal" width={120} height={40} className="h-8 w-auto mb-4" />
              <p className="text-gray-400">Making parking simple, smart, and stress-free with AI-powered solutions.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>AI Chat Assistant</li>
                <li>Interactive Maps</li>
                <li>Secure Payments</li>
                <li>Real-time Availability</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>LinkedIn</li>
                <li>Facebook</li>
                <li>Instagram</li>
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
