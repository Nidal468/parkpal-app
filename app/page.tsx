import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Shield, Smartphone, MessageCircle, Car, TestTube } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/parkpal-logo-clean.png" alt="ParkPal" className="h-8 w-auto" />
              <span className="text-xl font-bold text-gray-900">ParkPal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Find Parking
                </Button>
              </Link>
              <Link href="/reserve">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Reserve
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Parking Assistant
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find Perfect Parking with
            <span className="text-blue-600"> AI Chat</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simply chat with our AI assistant to find, compare, and book parking spaces. No more driving around looking
            for parking!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="px-8 py-4 text-lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Chatting
              </Button>
            </Link>
            <Link href="/reserve">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Test Commerce Layer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ParkPal?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform makes parking simple, secure, and stress-free
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>AI Chat Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simply describe what you need and our AI will find the perfect parking spot for you
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Real-time Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See live parking availability with interactive maps and instant booking
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Safe and secure payments with Stripe integration and Commerce Layer</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Smartphone className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Mobile Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Book parking on the go with our responsive mobile-first design</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Three simple steps to secure your parking</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Chat with AI</h3>
              <p className="text-gray-600">Tell our AI assistant where and when you need parking</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. View Options</h3>
              <p className="text-gray-600">Browse available spaces on the map with prices and details</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Book & Park</h3>
              <p className="text-gray-600">Secure your spot with instant booking and arrive stress-free</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Never Circle for Parking Again?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of drivers who've made parking effortless with ParkPal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Find Parking Now
              </Button>
            </Link>
            <Link href="/reserve">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <TestTube className="w-5 h-5 mr-2" />
                Test Integration
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/parkpal-logo-clean.png" alt="ParkPal" className="h-6 w-auto" />
                <span className="text-lg font-bold">ParkPal</span>
              </div>
              <p className="text-gray-400">AI-powered parking made simple</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/chat" className="hover:text-white">
                    Find Parking
                  </Link>
                </li>
                <li>
                  <Link href="/reserve" className="hover:text-white">
                    Test Reserve
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookies
                  </a>
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
