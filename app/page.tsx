import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Shield, Zap, MessageCircle, Search, Calendar } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">ParkPal</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  How it Works
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  AI Assistant
                </Link>
                <Link href="/reserve">
                  <Button>Reserve Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Perfect Parking
              <span className="text-blue-600 block">Instantly</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Skip the stress of finding parking. Our AI-powered platform connects you with available spaces in
              real-time, so you can focus on what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reserve">
                <Button size="lg" className="text-lg px-8 py-3">
                  Reserve Parking Now
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Try AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ParkPal?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've reimagined parking to be simple, smart, and stress-free
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Assistant</CardTitle>
                <CardDescription>
                  Chat with our intelligent assistant to find parking that matches your exact needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Real-Time Availability</CardTitle>
                <CardDescription>See live parking availability and reserve your spot before you arrive</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>All parking locations are verified and secure with 24/7 monitoring</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Instant Booking</CardTitle>
                <CardDescription>Reserve and pay for parking in seconds with our streamlined checkout</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Prime Locations</CardTitle>
                <CardDescription>Access parking in the most convenient locations across the city</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Flexible Options</CardTitle>
                <CardDescription>
                  Choose from hourly, daily, or monthly parking options to fit your schedule
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Getting parking has never been this easy</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Search & Chat</h3>
              <p className="text-gray-600">
                Tell our AI assistant where you need parking or browse available spaces on our map
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Reserve & Pay</h3>
              <p className="text-gray-600">
                Choose your duration, enter your details, and complete secure payment in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Park & Go</h3>
              <p className="text-gray-600">
                Arrive at your reserved spot and enjoy stress-free parking with instant access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Parking Space */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Parking Space</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">See what's available right now</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2 bg-gray-200 h-64 md:h-auto flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Interactive Map View</p>
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Downtown Premium Parking</h3>
                      <p className="text-gray-600 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        123 Main Street, Downtown
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    Secure covered parking in the heart of downtown. Perfect for business meetings and shopping.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="secondary">Covered</Badge>
                    <Badge variant="secondary">Security Cameras</Badge>
                    <Badge variant="secondary">EV Charging</Badge>
                    <Badge variant="secondary">24/7 Access</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">$8</p>
                      <p className="text-sm text-gray-500">per hour</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">$45</p>
                      <p className="text-sm text-gray-500">per day</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">$180</p>
                      <p className="text-sm text-gray-500">per month</p>
                    </div>
                  </div>

                  <Link href="/reserve">
                    <Button className="w-full" size="lg">
                      Reserve This Space
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Never Worry About Parking Again?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of drivers who have already discovered the future of parking
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reserve">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Parking Smarter
              </Button>
            </Link>
            <Link href="/chat">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat with AI Assistant
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
              <h3 className="text-2xl font-bold text-blue-400 mb-4">ParkPal</h3>
              <p className="text-gray-400">Making parking simple, smart, and stress-free for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/reserve" className="hover:text-white">
                    Reserve Parking
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-white">
                    AI Assistant
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms of Service
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
