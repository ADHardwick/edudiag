'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useJsApiLoader } from '@react-google-maps/api'
import { FilterBar } from './FilterBar'
import { DirectoryGrid } from './DirectoryGrid'
import { MapView } from './MapView'
import type { Diagnostician, Specialty } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  specialtiesOptions: Specialty[]
}

export function DirectoryPageClient({ diagnosticians, total, page, specialtiesOptions }: Props) {
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const searchParams = useSearchParams()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  return (
    <div className="space-y-6">
      <FilterBar specialtiesOptions={specialtiesOptions} view={view} onViewChange={setView} />
      {view === 'grid' ? (
        <DirectoryGrid
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          limit={12}
          searchParamsString={searchParams.toString()}
        />
      ) : (
        <MapView diagnosticians={diagnosticians} isLoaded={isLoaded} />
      )}
    </div>
  )
}
