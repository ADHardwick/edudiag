import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { geocode } from '@/lib/geocoding'

// Next.js 14.2+ requires params to be awaited. Use Promise<{id}> signature for forward-compatibility.
type Params = { params: Promise<{ id: string }> }

// GET /api/admin/diagnosticians/[id]
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('diagnosticians')
    .select(`
      *,
      specialties:diagnostician_specialties!left(specialty:specialties_lookup!left(*)),
      email_recipients:listing_email_recipients(email)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/admin/diagnosticians/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()
  const body = await request.json()
  const { specialties, emailRecipients, ...fields } = body

  const UPDATABLE_FIELDS = ['name', 'photo_url', 'bio', 'city', 'state', 'zip',
    'service_area', 'phone', 'email', 'website', 'is_published']
  const filteredFields: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).filter(([k]) => UPDATABLE_FIELDS.includes(k))
  )

  // Fetch current record to determine if geocoding is needed
  const { data: current, error: fetchError } = await supabase
    .from('diagnosticians')
    .select('city, state, zip')
    .eq('id', id)
    .single()

  if (fetchError || !current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let geocodeWarning = false
  // Only geocode if the request actually includes location fields AND they differ from current values
  const locationChanged =
    ('city' in filteredFields || 'state' in filteredFields || 'zip' in filteredFields) &&
    (filteredFields.city !== current?.city || filteredFields.state !== current?.state || filteredFields.zip !== current?.zip)

  if (locationChanged && (filteredFields.city || filteredFields.state || filteredFields.zip)) {
    const coords = await geocode(filteredFields.city as string ?? '', filteredFields.state as string ?? '', filteredFields.zip as string ?? '')
    if (coords) { filteredFields.lat = coords.lat; filteredFields.lng = coords.lng }
    else { filteredFields.lat = null; filteredFields.lng = null; geocodeWarning = true }
  }

  // Update diagnostician
  const { data: diag, error } = await supabase
    .from('diagnosticians')
    .update(filteredFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace specialties
  if (specialties !== undefined) {
    await supabase.from('diagnostician_specialties').delete().eq('diagnostician_id', id)
    if (specialties.length) {
      const { error: specialtyError } = await supabase.from('diagnostician_specialties').insert(
        specialties.map((specialtyId: string) => ({ diagnostician_id: id, specialty_id: specialtyId }))
      )
      if (specialtyError) return NextResponse.json({ error: specialtyError.message }, { status: 500 })
    }
  }

  // Replace email recipients
  if (emailRecipients !== undefined) {
    await supabase.from('listing_email_recipients').delete().eq('diagnostician_id', id)
    if (emailRecipients.length) {
      const { error: recipientError } = await supabase.from('listing_email_recipients').insert(
        emailRecipients.map((email: string) => ({ diagnostician_id: id, email }))
      )
      if (recipientError) return NextResponse.json({ error: recipientError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ data: diag, geocodeWarning })
}

// DELETE /api/admin/diagnosticians/[id]
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServiceClient()

  // Fetch photo URL before deleting (for Storage cleanup)
  const { data: diag } = await supabase
    .from('diagnosticians')
    .select('photo_url')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('diagnosticians')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort photo cleanup from Storage
  if (diag?.photo_url) {
    let path: string | undefined
    try {
      path = new URL(diag.photo_url).pathname.split('/diagnostician-photos/')[1]
    } catch {
      path = undefined
    }
    if (path) {
      await supabase.storage.from('diagnostician-photos').remove([path])
    }
  }

  return NextResponse.json({ success: true })
}
