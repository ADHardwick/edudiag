import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileDetail } from '@/components/listing/ProfileDetail'
import { LeadForm } from '@/components/listing/LeadForm'

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: d } = await supabase
    .from('diagnosticians')
    .select(`*, specialties:diagnostician_specialties(specialty:specialties_lookup(*))`)
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!d) notFound()

  const diagnostician = {
    ...d,
    specialties: d.specialties?.map((s: any) => s.specialty) ?? [],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile panel — overflow-hidden so dark header band fills to edges */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <ProfileDetail diagnostician={diagnostician} />
            </div>
          </div>

          {/* Lead form panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-indigo-700 mb-4">
                Request a Consultation
              </h2>
              <LeadForm
                diagnosticianId={diagnostician.id}
                diagnosticianName={diagnostician.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
