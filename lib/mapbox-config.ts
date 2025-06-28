"use server"

export async function getMapboxToken() {
  // Fixed to use the correct environment variable name
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
}
