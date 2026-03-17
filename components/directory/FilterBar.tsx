'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Specialty } from '@/types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
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

  const updateParam = useCallback((key: string, value: string | string[] | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
    } else if (value) {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const selectedSpecialties = searchParams.getAll('specialty')
  const selectedState = searchParams.get('state') ?? ''

  function toggleSpecialty(slug: string) {
    const next = selectedSpecialties.includes(slug)
      ? selectedSpecialties.filter((s) => s !== slug)
      : [...selectedSpecialties, slug]
    updateParam('specialty', next)
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap gap-4 items-end">
      {/* State filter */}
      <div>
        <label htmlFor="state-filter" className="block text-xs font-medium text-text-secondary mb-1">State</label>
        <select
          id="state-filter"
          value={selectedState}
          onChange={(e) => updateParam('state', e.target.value || null)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Specialty filter */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Specialties</label>
        <div className="flex flex-wrap gap-1 max-w-lg">
          {specialtiesOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSpecialty(s.slug)}
              aria-pressed={selectedSpecialties.includes(s.slug)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                selectedSpecialties.includes(s.slug)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="ml-auto">
        <label className="block text-xs font-medium text-text-secondary mb-1">View</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onViewChange('grid')}
            aria-pressed={view === 'grid'}
            className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-text-secondary'}`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewChange('map')}
            aria-pressed={view === 'map'}
            className={`px-3 py-2 text-sm ${view === 'map' ? 'bg-primary text-white' : 'bg-white text-text-secondary'}`}
          >
            Map
          </button>
        </div>
      </div>
    </div>
  )
}
