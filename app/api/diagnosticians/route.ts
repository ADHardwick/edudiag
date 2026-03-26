import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const state = searchParams.get('state')
  const city = searchParams.get('city')
  const specialties = searchParams.getAll('specialty')
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage)
  const rawLimit = parseInt(searchParams.get('limit') ?? '12', 10)
  const limit = isNaN(rawLimit) ? 12 : Math.min(48, Math.max(1, rawLimit))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties!left(specialty:specialties_lookup!left(*))`, { count: 'exact' })
    .eq('is_published', true)
    .order('name')
    .range(from, to)

  if (state) query = query.eq('state', state.toUpperCase())
  if (city) query = query.ilike('city', `%${city}%`)

  // Specialty OR filter: match any of the selected specialty slugs
  if (specialties.length) {
    const { data: matchedSpecialties } = await supabase
      .from('specialties_lookup')
      .select('id')
      .in('slug', specialties)
    const specialtyIds = (matchedSpecialties ?? []).map((s: { id: string }) => s.id)
    if (specialtyIds.length) {
      const { data: matchedDiags } = await supabase
        .from('diagnostician_specialties')
        .select('diagnostician_id')
        .in('specialty_id', specialtyIds)
      const ids = Array.from(new Set((matchedDiags ?? []).map((r: { diagnostician_id: string }) => r.diagnostician_id)))
      if (ids.length) query = query.in('id', ids)
      else return NextResponse.json({ data: [], total: 0, page, limit })
    }
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const diagnosticians = (data ?? []).map((d: any) => ({
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }))

  return NextResponse.json({ data: diagnosticians, total: count ?? 0, page, limit })
}
