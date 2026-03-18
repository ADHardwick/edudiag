import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
  if (!lead) notFound()

  const fields = [
    { label: 'Diagnostician', value: lead.diagnostician_name + (!lead.diagnostician_id ? ' (deleted)' : '') },
    { label: 'Parent/Guardian', value: lead.parent_name },
    { label: 'Email', value: lead.parent_email },
    { label: 'Phone', value: lead.parent_phone },
    { label: "Child's Age", value: lead.child_age },
    { label: "Child's School", value: lead.child_school ?? '—' },
    { label: 'Concerns', value: lead.child_concerns },
    { label: 'Message', value: lead.message ?? '—' },
    { label: 'Submitted', value: new Date(lead.created_at).toLocaleString() },
  ]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/leads" className="text-text-secondary hover:text-primary text-sm">← Leads</Link>
        <h1 className="text-2xl font-semibold text-primary">Lead Detail</h1>
      </div>
      <div className="bg-white rounded-xl border border-border p-6 max-w-xl">
        <dl className="space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 text-sm text-text-primary">{String(value ?? '—')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
