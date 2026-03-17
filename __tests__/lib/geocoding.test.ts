import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { geocode } from '@/lib/geocoding'

describe('geocode', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.GOOGLE_GEOCODING_API_KEY = 'test-api-key'
  })

  it('returns lat/lng on success', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 30.2672, lng: -97.7431 } } }],
      }),
    })
    const result = await geocode('Austin', 'TX', '78701')
    expect(result).toEqual({ lat: 30.2672, lng: -97.7431 })
  })

  it('returns null when status is not OK', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    })
    const result = await geocode('Nowhere', 'XX', '00000')
    expect(result).toBeNull()
  })

  it('returns null on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const result = await geocode('Austin', 'TX', '78701')
    expect(result).toBeNull()
  })
})
