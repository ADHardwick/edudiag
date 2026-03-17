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
      specialties:diagnostician_specialties(specialty:specialties_lookup(*)),
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

  // Fetch current record to determine if geocoding is needed
  const { data: current } = await supabase
    .from('diagnosticians')
    .select('city, state, zip')
    .eq('id', id)
    .single()

  let geocodeWarning = false
  // Only geocode if the request actually includes location fields AND they differ from current values
  const locationChanged =
    ('city' in fields || 'state' in fields || 'zip' in fields) &&
    (fields.city !== current?.city || fields.state !== current?.state || fields.zip !== current?.zip)

  if (locationChanged && (fields.city || fields.state || fields.zip)) {
    const coords = await geocode(fields.city ?? '', fields.state ?? '', fields.zip ?? '')
    if (coords) { fields.lat = coords.lat; fields.lng = coords.lng }
    else { fields.lat = null; fields.lng = null; geocodeWarning = true }
  }

  // Update diagnostician
  const { data: diag, error } = await supabase
    .from('diagnosticians')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace specialties
  if (specialties !== undefined) {
    await supabase.from('diagnostician_specialties').delete().eq('diagnostician_id', id)
    if (specialties.length) {
      await supabase.from('diagnostician_specialties').insert(
        specialties.map((specialtyId: string) => ({ diagnostician_id: id, specialty_id: specialtyId }))
      )
    }
  }

  // Replace email recipients
  if (emailRecipients !== undefined) {
    await supabase.from('listing_email_recipients').delete().eq('diagnostician_id', id)
    if (emailRecipients.length) {
      await supabase.from('listing_email_recipients').insert(
        emailRecipients.map((email: string) => ({ diagnostician_id: id, email }))
      )
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
    const path = diag.photo_url.split('/diagnostician-photos/')[1]
    if (path) {
      await supabase.storage.from('diagnostician-photos').remove([path])
    }
  }

  return NextResponse.json({ success: true })
}
