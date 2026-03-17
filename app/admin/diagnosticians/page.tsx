import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianTable } from '@/components/admin/DiagnosticianTable'

export default async function AdminDiagnosticiansPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`)
    .order('name')

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
      <DiagnosticianTable diagnosticians={diagnosticians} />
    </div>
  )
}
