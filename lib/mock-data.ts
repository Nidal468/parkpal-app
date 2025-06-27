export interface MockParkingSpace {
  id: string
  title: string
  location: string
  address: string
  postcode: string
  price_per_day: number
  price_per_month: number
  latitude: number
  longitude: number
  is_available: boolean
  total_spaces: number
  booked_spaces: number
  features: string[]
  description: string
  host_id: string
}

export const mockParkingSpaces: MockParkingSpace[] = [
  {
    id: "mock-1",
    title: "Secure Parking Near London Bridge",
    location: "SE1",
    address: "123 Borough High Street",
    postcode: "SE1 1AA",
    price_per_day: 15,
    price_per_month: 300,
    latitude: 51.5045,
    longitude: -0.0865,
    is_available: true,
    total_spaces: 5,
    booked_spaces: 2,
    features: ["CCTV", "Covered", "24/7 Access"],
    description: "Secure covered parking space near London Bridge station",
    host_id: "host-1",
  },
  {
    id: "mock-2",
    title: "Budget Parking SE17",
    location: "SE17",
    address: "456 Elephant Road",
    postcode: "SE17 2BB",
    price_per_day: 12,
    price_per_month: 250,
    latitude: 51.4948,
    longitude: -0.0877,
    is_available: true,
    total_spaces: 3,
    booked_spaces: 1,
    features: ["Gated", "Well-lit"],
    description: "Affordable parking in SE17 area",
    host_id: "host-2",
  },
  {
    id: "mock-3",
    title: "Premium Parking Borough",
    location: "Borough",
    address: "789 Southwark Street",
    postcode: "SE1 0AA",
    price_per_day: 20,
    price_per_month: 400,
    latitude: 51.5033,
    longitude: -0.0934,
    is_available: true,
    total_spaces: 2,
    booked_spaces: 0,
    features: ["Electric Charging", "Covered", "Security"],
    description: "Premium parking with EV charging in Borough",
    host_id: "host-3",
  },
]

export function searchMockParkingSpaces(searchParams: any): MockParkingSpace[] {
  let results = mockParkingSpaces.filter((space) => space.is_available)

  if (searchParams.location) {
    const locationTerm = searchParams.location.toLowerCase()
    results = results.filter(
      (space) =>
        space.location.toLowerCase().includes(locationTerm) ||
        space.address.toLowerCase().includes(locationTerm) ||
        space.postcode.toLowerCase().includes(locationTerm) ||
        space.title.toLowerCase().includes(locationTerm),
    )
  }

  if (searchParams.maxPrice) {
    results = results.filter((space) => space.price_per_day <= searchParams.maxPrice)
  }

  return results
}
