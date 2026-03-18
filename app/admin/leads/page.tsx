import { createServiceClient } from '@/lib/supabase/server'
import { LeadsTable } from '@/components/admin/LeadsTable'

export default async function AdminLeadsPage() {
  const supabase = createServiceClient()
  const [{ data: leads, error: leadsError }, { data: diagnosticians, error: diagError }] = await Promise.all([
    supabase.from('leads').select('id, diagnostician_id, diagnostician_name, parent_name, parent_email, created_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('diagnosticians').select('id, name').order('name'),
  ])
  if (leadsError) console.error('Failed to load leads:', leadsError.message)
  if (diagError) console.error('Failed to load diagnosticians:', diagError.message)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Leads</h1>
      <LeadsTable leads={leads ?? []} diagnosticianOptions={diagnosticians ?? []} />
    </div>
  )
}
