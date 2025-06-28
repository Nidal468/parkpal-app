import type { ParkingSpaceDisplay, User, Vehicle } from "./supabase-types"

// Mock users data
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "john.host@example.com",
    name: "John Smith",
    role: "host",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    email: "sarah.host@example.com",
    name: "Sarah Johnson",
    role: "host",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "user-3",
    email: "mike.parker@example.com",
    name: "Mike Parker",
    role: "user",
    created_at: "2024-01-03T00:00:00Z",
  },
]

// Mock vehicles data
export const mockVehicles: Vehicle[] = [
  {
    id: "vehicle-1",
    created_at: "2024-01-01T00:00:00Z",
    user_id: "user-3",
    reg: "AB12 CDE",
    make: "Toyota",
    model: "Camry",
    colour: "Blue",
  },
  {
    id: "vehicle-2",
    created_at: "2024-01-02T00:00:00Z",
    user_id: "user-3",
    reg: "XY98 ZAB",
    make: "Honda",
    model: "Civic",
    colour: "Red",
  },
]

// Updated mock parking data with host information
export const mockParkingSpaces: ParkingSpaceDisplay[] = [
  {
    id: "1",
    host_id: "user-1",
    title: "Secure Underground Parking",
    location: "Kennington",
    address: "123 Kennington Road",
    postcode: "SE17 1AB",
    description: "Safe underground parking with 24/7 security and CCTV monitoring. Perfect for long-term stays.",
    features: ["24/7 Security", "CCTV", "Underground", "Electric Charging"],
    price_per_day: 15,
    image_url: "/placeholder.svg?height=200&width=300&text=Underground+Parking",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.4875,
    longitude: -0.1097,
    what3words: "///parks.secure.underground",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "00:00-23:59",
    host: mockUsers[0],
  },
  {
    id: "2",
    host_id: "user-1",
    title: "Kennington Road Parking",
    location: "Kennington",
    address: "456 Kennington Road",
    postcode: "SE17 2CD",
    description: "Convenient street-level parking near Kennington tube station. Easy access to central London.",
    features: ["Near Tube", "Street Level", "Pay & Display"],
    price_per_day: 12,
    image_url: "/placeholder.svg?height=200&width=300&text=Street+Parking",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.4889,
    longitude: -0.1063,
    what3words: "///street.level.parking",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "06:00-22:00",
    host: mockUsers[0],
  },
  {
    id: "3",
    host_id: "user-2",
    title: "Covered Parking Bay",
    location: "Kennington",
    address: "789 Kennington Park Road",
    postcode: "SE17 3EF",
    description: "Weather-protected parking space in a residential area. Quiet and secure location.",
    features: ["Covered", "Residential", "Quiet Area"],
    price_per_day: 18,
    image_url: "/placeholder.svg?height=200&width=300&text=Covered+Parking",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.4901,
    longitude: -0.1089,
    what3words: "///covered.quiet.residential",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "00:00-23:59",
    host: mockUsers[1],
  },
  {
    id: "4",
    host_id: "user-2",
    title: "Budget Parking Space",
    location: "Elephant & Castle",
    address: "321 New Kent Road",
    postcode: "SE1 4GH",
    description: "Affordable parking option near Elephant & Castle. Good transport links to central London.",
    features: ["Budget Friendly", "Transport Links", "Open Air"],
    price_per_day: 8,
    image_url: "/placeholder.svg?height=200&width=300&text=Budget+Parking",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.4946,
    longitude: -0.0999,
    what3words: "///budget.transport.links",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "07:00-19:00",
    host: mockUsers[1],
  },
  {
    id: "5",
    host_id: "user-1",
    title: "Premium Parking Garage",
    location: "Vauxhall",
    address: "654 Vauxhall Bridge Road",
    postcode: "SE11 5IJ",
    description: "High-end parking facility with valet service and car wash options. Premium location.",
    features: ["Valet Service", "Car Wash", "Premium", "Indoor"],
    price_per_day: 25,
    image_url: "/placeholder.svg?height=200&width=300&text=Premium+Garage",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.4857,
    longitude: -0.124,
    what3words: "///premium.valet.service",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "00:00-23:59",
    host: mockUsers[0],
  },
  {
    id: "6",
    host_id: "user-2",
    title: "Waterloo Station Parking",
    location: "Waterloo",
    address: "987 Waterloo Road",
    postcode: "SE1 8KL",
    description: "Convenient parking near Waterloo station. Perfect for commuters and visitors to central London.",
    features: ["Near Station", "Commuter Friendly", "Central Location"],
    price_per_day: 20,
    image_url: "/placeholder.svg?height=200&width=300&text=Station+Parking",
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    is_available: true,
    latitude: 51.5045,
    longitude: -0.1097,
    what3words: "///station.commuter.central",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "05:00-23:00",
    host: mockUsers[1],
  },
]

export function searchMockParkingSpaces(params: {
  location?: string
  postcode?: string
  what3words?: string
  startDate?: string
  endDate?: string
  maxPrice?: number
  features?: string[]
}): ParkingSpaceDisplay[] {
  let results = [...mockParkingSpaces]

  // Filter by location (search in location, address, postcode)
  if (params.location) {
    const locationLower = params.location.toLowerCase()
    results = results.filter(
      (space) =>
        space.location.toLowerCase().includes(locationLower) ||
        space.title.toLowerCase().includes(locationLower) ||
        space.address?.toLowerCase().includes(locationLower) ||
        space.postcode?.toLowerCase().includes(locationLower),
    )
  }

  // Filter by postcode
  if (params.postcode) {
    const postcodeLower = params.postcode.toLowerCase()
    results = results.filter((space) => space.postcode?.toLowerCase().includes(postcodeLower))
  }

  // Filter by what3words
  if (params.what3words) {
    const what3wordsLower = params.what3words.toLowerCase()
    results = results.filter((space) => space.what3words?.toLowerCase().includes(what3wordsLower))
  }

  // Filter by features
  if (params.features && params.features.length > 0) {
    results = results.filter((space) =>
      params.features!.some((feature) =>
        space.features.some((spaceFeature) => spaceFeature.toLowerCase().includes(feature.toLowerCase())),
      ),
    )
  }

  // Filter by price
  if (params.maxPrice) {
    results = results.filter((space) => (space.price_per_day || 0) <= params.maxPrice!)
  }

  // Sort by price (cheapest first)
  results.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0))

  // Limit to 6 results
  return results.slice(0, 6)
}
