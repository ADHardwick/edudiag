'use client'
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

interface Props {
  diagnosticians: Diagnostician[]
  isLoaded: boolean
}

export function MapView({ diagnosticians, isLoaded }: Props) {
  const [selected, setSelected] = useState<Diagnostician | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const withCoords = useMemo(
    () => diagnosticians.filter((d) => d.lat && d.lng),
    [diagnosticians]
  )

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    if (!mapRef.current || !withCoords.length) return
    const bounds = new google.maps.LatLngBounds()
    withCoords.forEach((d) => bounds.extend({ lat: d.lat!, lng: d.lng! }))
    mapRef.current.fitBounds(bounds)
  }, [withCoords])

  const markerIcon = useMemo(() => {
    if (!isLoaded) return undefined
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#1e3a5f',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 1,
      scale: 1.5,
      anchor: new google.maps.Point(12, 22),
    }
  }, [isLoaded])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!isLoaded) {
    return (
      <div className="h-[500px] bg-surface rounded-xl flex items-center justify-center text-text-secondary">
        Loading map…
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="h-[500px] bg-surface rounded-xl flex items-center justify-center text-text-secondary">
        Map unavailable
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Showing {withCoords.length} location{withCoords.length !== 1 ? 's' : ''} for current results.
        Use filters to narrow results.
      </p>
      <div className="rounded-xl overflow-hidden border border-border relative">
        {withCoords.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl z-10">
            <p className="text-text-secondary text-sm">No location data available for current results.</p>
          </div>
        )}
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '500px' }}
          zoom={5}
          center={{ lat: 39.5, lng: -98.35 }}
          options={{ styles: MAP_STYLES, streetViewControl: false, mapTypeControl: false }}
          onLoad={onLoad}
        >
          {withCoords.map((d) => (
            <Marker
              key={d.id}
              position={{ lat: d.lat!, lng: d.lng! }}
              icon={markerIcon}
              onClick={() => setSelected(d)}
            />
          ))}
          {selected && selected.lat && selected.lng && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              options={{ pixelOffset: new google.maps.Size(0, -30) }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="p-1 max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {selected.photo_url && (
                    <Image src={selected.photo_url} alt={selected.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-primary">{selected.name}</p>
                    <p className="text-xs text-text-secondary">{[selected.city, selected.state].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
                {selected.specialties && selected.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selected.specialties.slice(0, 2).map((s) => (
                      <span key={s.id} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">{s.name}</span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/diagnosticians/${selected.slug}`}
                  aria-label={`View profile for ${selected.name}`}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View Profile <span aria-hidden="true">→</span>
                </Link>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  )
}
