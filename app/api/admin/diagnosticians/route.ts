import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/slug'
import { geocode } from '@/lib/geocoding'

// GET /api/admin/diagnosticians?page=1&limit=20&search=jane
export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 20)))
  const search = searchParams.get('search') ?? ''
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`, { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0, page, limit })
}

// POST /api/admin/diagnosticians
export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { specialties, emailRecipients, ...fields } = body

  const POST_FIELDS = ['name', 'photo_url', 'bio', 'city', 'state', 'zip',
    'service_area', 'phone', 'email', 'website', 'is_published']
  const filteredFields: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).filter(([k]) => POST_FIELDS.includes(k))
  )

  // Validate required fields
  if (!filteredFields.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Generate unique slug
  const { data: existing } = await supabase.from('diagnosticians').select('slug')
  const takenSlugs = (existing ?? []).map((d: { slug: string }) => d.slug)
  const slug = generateSlug(filteredFields.name as string, takenSlugs)

  // Geocode on create (unconditional)
  let lat: number | null = null
  let lng: number | null = null
  let geocodeWarning = false
  if (filteredFields.city || filteredFields.state || filteredFields.zip) {
    const coords = await geocode(filteredFields.city as string ?? '', filteredFields.state as string ?? '', filteredFields.zip as string ?? '')
    if (coords) { lat = coords.lat; lng = coords.lng }
    else { geocodeWarning = true }
  }

  // Insert diagnostician
  const { data: diag, error } = await supabase
    .from('diagnosticians')
    .insert({ ...filteredFields, slug, lat, lng })
    .select()
    .single()

  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  // Insert specialties
  if (specialties?.length) {
    const { error: specialtyError } = await supabase.from('diagnostician_specialties').insert(
      specialties.map((id: string) => ({ diagnostician_id: diag.id, specialty_id: id }))
    )
    if (specialtyError) return NextResponse.json({ error: specialtyError.message }, { status: 500 })
  }

  // Insert email recipients
  if (emailRecipients?.length) {
    const { error: recipientError } = await supabase.from('listing_email_recipients').insert(
      emailRecipients.map((email: string) => ({ diagnostician_id: diag.id, email }))
    )
    if (recipientError) return NextResponse.json({ error: recipientError.message }, { status: 500 })
  }

  return NextResponse.json({ data: diag, geocodeWarning }, { status: 201 })
}
