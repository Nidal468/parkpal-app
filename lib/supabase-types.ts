export interface ParkingSpace {
  id: string
  title: string
  location: string
  description: string
  features: string[]
  price_per_day: number
  image_url: string
  created_at: string
  available_from?: string
  available_to?: string
  is_available: boolean
}

export interface Message {
  id: string
  created_at: string
  user_message: string
  bot_response: string
}
