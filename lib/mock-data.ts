import type { ParkingSpace } from "./supabase-types"

export const mockParkingSpaces: ParkingSpace[] = [
  {
    id: "73bef0f1-d91c-49b4-9520-dcf43f976250",
    title: "Secure Parking near Elephant & Castle Station",
    description:
      "Safe and secure parking space just 2 minutes walk from Elephant & Castle Underground Station. Perfect for commuters and visitors to Central London.",
    address: "123 New Kent Road, London SE1 6AJ",
    postcode: "SE1 6AJ",
    latitude: 51.4948,
    longitude: -0.0877,
    price_per_hour: 3.0,
    price_per_day: 15.0,
    price_per_month: 300.0,
    availability: "available",
    space_type: "driveway",
    features: ["covered", "secure", "cctv"],
    owner_id: "owner-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    title: "Private Driveway - SE17 Area",
    description:
      "Convenient private driveway parking in the heart of SE17. Easy access to local shops and transport links.",
    address: "456 Walworth Road, London SE17 1JL",
    postcode: "SE17 1JL",
    latitude: 51.4856,
    longitude: -0.0944,
    price_per_hour: 2.5,
    price_per_day: 12.0,
    price_per_month: 250.0,
    availability: "available",
    space_type: "driveway",
    features: ["private", "easy_access"],
    owner_id: "owner-2",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]
