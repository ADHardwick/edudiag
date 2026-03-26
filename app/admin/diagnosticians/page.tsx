import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianTable } from '@/components/admin/DiagnosticianTable'

export const dynamic = 'force-dynamic'

export default async function AdminDiagnosticiansPage() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties!left(specialty:specialties_lookup!left(*))`)
    .order('name')

  if (error) {
    console.error('Admin diagnosticians query error:', error)
  }

  const diagnosticians = (data ?? []).map((d: any) => ({
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-primary">Diagnosticians</h1>
        <Link
          href="/admin/diagnosticians/new"
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + New Listing
        </Link>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm font-mono">
          Query error: {error.message} (code: {error.code})
        </div>
      )}
      <DiagnosticianTable diagnosticians={diagnosticians} />
    </div>
  )
}
