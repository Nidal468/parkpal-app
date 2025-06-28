export async function getMapboxToken(): Promise<string> {
  // Your environment variable is NEXT_PUBLIC_MAPBOX_TOKEN, not NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
}
