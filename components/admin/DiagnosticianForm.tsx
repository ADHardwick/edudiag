'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { EmailRecipientsInput } from './EmailRecipientsInput'
import type { Diagnostician, Specialty } from '@/types'

interface Props {
  diagnostician?: Partial<Diagnostician>
  specialtiesOptions: Specialty[]
}

export function DiagnosticianForm({ diagnostician, specialtiesOptions }: Props) {
  const router = useRouter()
  const isEdit = !!diagnostician?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geocodeWarning, setGeocodeWarning] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(diagnostician?.photo_url ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: diagnostician?.name ?? '',
    bio: diagnostician?.bio ?? '',
    city: diagnostician?.city ?? '',
    state: diagnostician?.state ?? '',
    zip: diagnostician?.zip ?? '',
    service_area: diagnostician?.service_area ?? '',
    phone: diagnostician?.phone ?? '',
    email: diagnostician?.email ?? '',
    website: diagnostician?.website ?? '',
    is_published: diagnostician?.is_published ?? false,
    photo_url: diagnostician?.photo_url ?? '',
    specialties: diagnostician?.specialties?.map((s) => s.id) ?? [],
    emailRecipients: diagnostician?.email_recipients ?? [],
  })

  function set(field: keyof typeof form, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function uploadPhoto(): Promise<string | null> {
    const file = fileRef.current?.files?.[0]
    if (!file) return null
    const fd = new FormData()
    fd.append('file', file)
    if (form.photo_url) fd.append('oldUrl', form.photo_url)
    const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeocodeWarning(false)

    let photo_url = form.photo_url
    if (fileRef.current?.files?.[0]) {
      const url = await uploadPhoto()
      if (url) {
        photo_url = url
      } else {
        setError('Photo upload failed. Please try again.')
        setLoading(false)
        return
      }
    }

    const payload = { ...form, photo_url, specialties: form.specialties, emailRecipients: form.emailRecipients }
    const url = isEdit
      ? `/api/admin/diagnosticians/${diagnostician!.id}`
      : '/api/admin/diagnosticians'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      return
    }

    if (json.geocodeWarning) {
      setGeocodeWarning(true)
      setTimeout(() => { window.location.href = '/admin/diagnosticians' }, 2500)
    } else {
      window.location.href = '/admin/diagnosticians'
    }
  }

  const inputCls = 'w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const labelCls = 'block text-sm font-medium text-text-secondary mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">{error}</div>}
      {geocodeWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-4 py-3 text-sm">
          Address could not be geocoded. Listing saved but will not appear on the map.
        </div>
      )}

      {/* Basic info */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea className={inputCls} rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Photo</label>
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mb-2" />}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setPhotoPreview(URL.createObjectURL(f))
              }}
            />
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Specialties</h2>
        <div className="grid grid-cols-2 gap-2">
          {specialtiesOptions.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.specialties.includes(s.id)}
                onChange={(e) => {
                  set('specialties', e.target.checked
                    ? [...form.specialties, s.id]
                    : form.specialties.filter((id: string) => id !== s.id)
                  )
                }}
              />
              {s.name}
            </label>
          ))}
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Location</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>City</label>
            <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input className={inputCls} maxLength={2} placeholder="TX" value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>ZIP</label>
            <input className={inputCls} value={form.zip} onChange={(e) => set('zip', e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={labelCls}>Service Area</label>
            <input className={inputCls} placeholder="e.g. Greater Austin area, Travis County" value={form.service_area} onChange={(e) => set('service_area', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input className={inputCls} type="url" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Lead email recipients */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-1">Additional Lead Recipients</h2>
        <p className="text-xs text-text-secondary mb-3">
          The default admin email always receives leads. Add extra addresses here.
        </p>
        <EmailRecipientsInput
          value={form.emailRecipients}
          onChange={(emails) => set('emailRecipients', emails)}
        />
      </section>

      {/* Published */}
      <section>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-medium">Published (visible on public directory)</span>
        </label>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving\u2026' : isEdit ? 'Save Changes' : 'Create Listing'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/diagnosticians')}
          className="px-6 py-2 border border-border rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
