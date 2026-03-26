'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Specialty } from '@/types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

interface Props {
  specialtiesOptions: Specialty[]
  view: 'grid' | 'map'
  onViewChange: (view: 'grid' | 'map') => void
}

export function FilterBar({ specialtiesOptions, view, onViewChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      } else if (value) {
        params.set(key, value)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const selectedSpecialties = searchParams.getAll('specialty')
  const selectedState = searchParams.get('state') ?? ''

  function toggleSpecialty(slug: string) {
    const next = selectedSpecialties.includes(slug)
      ? selectedSpecialties.filter((s) => s !== slug)
      : [...selectedSpecialties, slug]
    updateParam('specialty', next)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center mb-7">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mr-1">
        Filter:
      </span>

      {/* State dropdown — pill chip shape */}
      <select
        id="state-filter"
        value={selectedState}
        onChange={(e) => updateParam('state', e.target.value || null)}
        className="border-2 border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white"
        aria-label="Filter by state"
      >
        <option value="">All States</option>
        {US_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Specialty pill chips */}
      {specialtiesOptions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => toggleSpecialty(s.slug)}
          aria-pressed={selectedSpecialties.includes(s.slug)}
          className={`border-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            selectedSpecialties.includes(s.slug)
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {s.name}
        </button>
      ))}

      {/* Grid / Map view toggle */}
      <div className="ml-auto flex rounded-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => onViewChange('grid')}
          aria-pressed={view === 'grid'}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'grid'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => onViewChange('map')}
          aria-pressed={view === 'map'}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'map'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Map
        </button>
      </div>
    </div>
  )
}
