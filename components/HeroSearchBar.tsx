'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Specialty } from '@/types'

interface Props {
  specialtiesOptions: Specialty[]
}

export function HeroSearchBar({ specialtiesOptions }: Props) {
  const router = useRouter()
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialty) params.set('specialty', specialty)
    if (location) params.set('state', location)
    router.push(`/diagnosticians?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row max-w-[520px] mx-auto rounded-xl p-1.5 gap-1 sm:gap-0"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <select
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2.5 text-white"
        style={{ color: specialty ? 'white' : '#94a3b8' }}
        aria-label="Filter by specialty"
      >
        <option value="" style={{ background: '#1e293b', color: 'white' }}>All Specialties</option>
        {specialtiesOptions.map((s) => (
          <option key={s.id} value={s.slug} style={{ background: '#1e293b', color: 'white' }}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="hidden sm:block w-px my-2" style={{ background: 'rgba(255,255,255,0.1)' }} />

      <input
        type="text"
        placeholder="City or state…"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2.5 placeholder-slate-500 text-white"
        aria-label="Filter by city or state"
      />

      <button
        type="submit"
        className="text-white text-sm font-bold px-5 py-2.5 rounded-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        Search →
      </button>
    </form>
  )
}
