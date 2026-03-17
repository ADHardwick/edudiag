import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianForm } from '@/components/admin/DiagnosticianForm'

export default async function NewDiagnosticianPage() {
  const supabase = createServiceClient()
  const { data: specialtiesOptions } = await supabase.from('specialties_lookup').select('*').order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">New Listing</h1>
      <DiagnosticianForm specialtiesOptions={specialtiesOptions ?? []} />
    </div>
  )
}
