import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/admin/StatCard'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalPublished, error: e1 },
    { count: totalLeads, error: e2 },
    { count: recentLeads, error: e3 },
    { data: latestLeads, error: e4 },
  ] = await Promise.all([
    supabase.from('diagnosticians').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('id, parent_name, diagnostician_name, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  if (e1 || e2 || e3 || e4) {
    console.error('Admin dashboard query error:', e1 ?? e2 ?? e3 ?? e4)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Published Listings" value={totalPublished ?? 0} />
        <StatCard label="Total Leads" value={totalLeads ?? 0} />
        <StatCard label="Leads (Last 30 Days)" value={recentLeads ?? 0} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Leads</h2>
          <Link href="/admin/leads" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {(latestLeads ?? []).map((l) => (
            <Link key={l.id} href={`/admin/leads/${l.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">{l.parent_name}</p>
                <p className="text-xs text-text-secondary">for {l.diagnostician_name}</p>
              </div>
              <p className="text-xs text-text-secondary">{new Date(l.created_at).toLocaleDateString('en-US')}</p>
            </Link>
          ))}
          {!(latestLeads ?? []).length && (
            <p className="px-4 py-6 text-sm text-text-secondary text-center">No leads yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
