import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getRateLimiter } from '@/lib/rate-limit'
import { sendLeadEmails } from '@/lib/email'

export async function POST(request: NextRequest) {
  // Per spec: rate limit check runs before honeypot check.
  // This intentionally consumes rate limit quota before reading the body so that
  // bots that don't set the honeypot are still throttled without parsing the body first.
  const rawForwardedFor = request.headers.get('x-forwarded-for') ?? ''
  const ip = rawForwardedFor.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  const limiter = getRateLimiter()
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await request.json()

  // Honeypot check — silently succeed without doing anything (no DB insert, no email)
  if (body._hp && body._hp !== '') {
    return NextResponse.json({ ok: true })
  }

  // Validate required fields
  const required = ['diagnostician_id', 'diagnostician_name', 'parent_name', 'parent_email', 'parent_phone', 'child_age', 'child_concerns']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  const childAge = Number(body.child_age)
  if (isNaN(childAge) || childAge < 3 || childAge > 21) {
    return NextResponse.json({ error: 'child_age must be between 3 and 21' }, { status: 400 })
  }

  const MAX_LENGTHS: Record<string, number> = {
    parent_name: 120,
    parent_email: 254,
    parent_phone: 30,
    diagnostician_name: 200,
    child_school: 200,
    child_concerns: 2000,
    message: 2000,
  }

  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (typeof body[field] === 'string' && body[field].length > max) {
      return NextResponse.json({ error: `${field} exceeds maximum length` }, { status: 400 })
    }
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(body.diagnostician_id)) {
    return NextResponse.json({ error: 'Invalid diagnostician_id' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: diag, error: diagError } = await supabase
    .from('diagnosticians')
    .select('id, name')
    .eq('id', body.diagnostician_id)
    .eq('is_published', true)
    .single()

  if (diagError || !diag) {
    return NextResponse.json({ error: 'Diagnostician not found' }, { status: 404 })
  }

  // Insert lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      diagnostician_id: body.diagnostician_id,
      diagnostician_name: diag.name,
      parent_name: body.parent_name,
      parent_email: body.parent_email,
      parent_phone: body.parent_phone,
      child_age: childAge,
      child_school: body.child_school ?? null,
      child_concerns: body.child_concerns,
      message: body.message ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch additional recipients for this diagnostician
  const { data: recipients } = await supabase
    .from('listing_email_recipients')
    .select('email')
    .eq('diagnostician_id', body.diagnostician_id)

  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_DEFAULT_EMAIL is not configured — lead notifications will not be sent')
  }
  const allRecipients = [
    adminEmail,
    ...(recipients ?? []).map((r: { email: string }) => r.email),
  ].filter((e): e is string => Boolean(e))

  // Send emails (best effort — don't fail the request if email fails)
  try {
    await sendLeadEmails(allRecipients, {
      diagnosticianName: diag.name,
      parentName: body.parent_name,
      parentEmail: body.parent_email,
      parentPhone: body.parent_phone,
      childAge,
      childSchool: body.child_school,
      childConcerns: body.child_concerns,
      message: body.message,
      leadId: lead.id,
    })
  } catch (err) {
    console.error('Lead email send failed (non-blocking):', err)
  }

  return NextResponse.json({ ok: true })
}
