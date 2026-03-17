'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FilterBar } from './FilterBar'
import { DirectoryGrid } from './DirectoryGrid'
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

  return (
    <div className="space-y-6">
      <FilterBar specialtiesOptions={specialtiesOptions} view={view} onViewChange={setView} />
      {/* MapView wired in Chunk 9 — map toggle visible but non-functional until then */}
      <DirectoryGrid
        diagnosticians={diagnosticians}
        total={total}
        page={page}
        limit={12}
        searchParamsString={searchParams.toString()}
      />
    </div>
  )
}
