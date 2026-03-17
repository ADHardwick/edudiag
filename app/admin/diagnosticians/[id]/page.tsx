import { createServiceClient } from '@/lib/supabase/server'
import { DiagnosticianForm } from '@/components/admin/DiagnosticianForm'
import { notFound } from 'next/navigation'

export default async function EditDiagnosticianPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const [{ data: diag }, { data: specialtiesOptions }] = await Promise.all([
    supabase
      .from('diagnosticians')
      .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*)), email_recipients:listing_email_recipients(email)`)
      .eq('id', params.id)
      .single(),
    supabase.from('specialties_lookup').select('*').order('name'),
  ])

  if (!diag) notFound()

  const diagnostician = {
    ...diag,
    specialties: diag.specialties?.map((s: any) => s.specialty) ?? [],
    email_recipients: diag.email_recipients?.map((r: any) => r.email) ?? [],
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-6">Edit: {diag.name}</h1>
      <DiagnosticianForm diagnostician={diagnostician} specialtiesOptions={specialtiesOptions ?? []} />
    </div>
  )
}
