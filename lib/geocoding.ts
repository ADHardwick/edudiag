export async function geocode(
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY
  if (!key) return null

  const address = encodeURIComponent(`${city}, ${state} ${zip}`)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${key}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.status !== 'OK' || !data.results.length) return null
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  } catch {
    return null
  }
}
