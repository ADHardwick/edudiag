import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'
import type { Diagnostician } from '@/types'

export default async function DiagnosticiansPage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty ? [searchParams.specialty] : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  let diagnosticians: Diagnostician[] = []
  let total = 0
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      diagnosticians = json.data ?? []
      total = json.total ?? 0
    }
  } catch {
    // fetch failed — show empty directory rather than crashing
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">All Diagnosticians</h1>
        <DirectoryPageClient
          diagnosticians={diagnosticians}
          total={total}
          page={page}
          specialtiesOptions={specialtiesOptions ?? []}
        />
      </div>
    </div>
  )
}
