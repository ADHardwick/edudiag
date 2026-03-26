'use client'
import { useState } from 'react'

interface Props {
  diagnosticianId: string
  diagnosticianName: string
}

const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 3)

export function LeadForm({ diagnosticianId, diagnosticianName }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'ratelimited'>(
    'idle'
  )
  const [form, setForm] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    child_age: '',
    child_school: '',
    child_concerns: '',
    message: '',
    _hp: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        child_age: Number(form.child_age),
        diagnostician_id: diagnosticianId,
        diagnostician_name: diagnosticianName,
      }),
    })
    if (res.ok) {
      setStatus('success')
    } else if (res.status === 429) {
      setStatus('ratelimited')
    } else {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-indigo-700">Your inquiry has been sent!</p>
        <p className="text-sm text-slate-500 mt-1">You&apos;ll be contacted soon.</p>
      </div>
    )
  }

  const inputCls =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="_hp"
        value={form._hp}
        onChange={(e) => set('_hp', e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
        aria-hidden="true"
      />

      <div>
        <label htmlFor="parent_name" className={labelCls}>Your Name *</label>
        <input
          id="parent_name"
          className={inputCls}
          value={form.parent_name}
          onChange={(e) => set('parent_name', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="parent_email" className={labelCls}>Email *</label>
        <input
          id="parent_email"
          type="email"
          className={inputCls}
          value={form.parent_email}
          onChange={(e) => set('parent_email', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="parent_phone" className={labelCls}>Phone *</label>
        <input
          id="parent_phone"
          type="tel"
          className={inputCls}
          value={form.parent_phone}
          onChange={(e) => set('parent_phone', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="child_age" className={labelCls}>Child&apos;s Age *</label>
        <select
          id="child_age"
          className={inputCls}
          value={form.child_age}
          onChange={(e) => set('child_age', e.target.value)}
          required
        >
          <option value="">Select age</option>
          {AGE_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="child_school" className={labelCls}>Child&apos;s Current School</label>
        <input
          id="child_school"
          className={inputCls}
          value={form.child_school}
          onChange={(e) => set('child_school', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="child_concerns" className={labelCls}>Child&apos;s Concerns *</label>
        <textarea
          id="child_concerns"
          className={inputCls}
          rows={3}
          value={form.child_concerns}
          onChange={(e) => set('child_concerns', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="message" className={labelCls}>Additional Notes</label>
        <textarea
          id="message"
          className={inputCls}
          rows={2}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>
      )}
      {status === 'ratelimited' && (
        <p className="text-yellow-700 text-xs">Too many submissions. Please wait before trying again.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        {status === 'loading' ? 'Sending…' : 'Send Inquiry'}
      </button>
    </form>
  )
}
