import { createClient } from '@/lib/supabase/server'
import { DirectoryPageClient } from '@/components/directory/DirectoryPageClient'
import { HeroSearchBar } from '@/components/HeroSearchBar'
import type { Diagnostician } from '@/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>
}) {
  const supabase = createClient()
  const { data: specialtiesOptions } = await supabase
    .from('specialties_lookup')
    .select('*')
    .order('name')

  const state = typeof searchParams.state === 'string' ? searchParams.state : ''
  const specialties = Array.isArray(searchParams.specialty)
    ? searchParams.specialty
    : searchParams.specialty
    ? [searchParams.specialty]
    : []
  const page = Number(searchParams.page ?? 1)

  const params = new URLSearchParams()
  if (state) params.set('state', state)
  specialties.forEach((s) => params.append('specialty', s))
  params.set('page', String(page))
  params.set('limit', '12')

  let diagnosticians: Diagnostician[] = []
  let total = 0
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/diagnosticians?${params}`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const json = await res.json()
      diagnosticians = json.data ?? []
      total = json.total ?? 0
    }
  } catch {
    // fetch failed — show empty directory rather than crashing
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 pt-[72px] pb-20 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        }}
      >
        {/* Radial glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />

        <div className="relative">
          {/* Eyebrow pill */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest rounded-full px-3.5 py-1.5 mb-6"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
            }}
          >
            ✦ Serving TX · NM · LA
          </span>

          {/* H1 */}
          <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
            Find the right specialist
            <br />
            for{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #818cf8, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              your child
            </span>
          </h1>

          <p className="text-[17px] text-slate-400 max-w-[480px] mx-auto leading-relaxed mb-10">
            Connect with certified educational diagnosticians across Texas, New Mexico, and
            Louisiana — specialists in assessing your child&apos;s unique learning needs.
          </p>

          {/* Search bar — client component */}
          <HeroSearchBar specialtiesOptions={specialtiesOptions ?? []} />

          {/* Stats row */}
          <div className="flex justify-center gap-10 mt-11 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">40+</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">Specialists</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">12</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">Specialties</p>
            </div>
            <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">3 States</p>
              <p className="text-[11px] tracking-wider text-slate-500 mt-0.5">TX · NM · LA</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Directory section ─────────────────────────────────────────────── */}
      {/* No <h1> here — the hero H1 serves that role */}
      <div className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DirectoryPageClient
            diagnosticians={diagnosticians}
            total={total}
            page={page}
            specialtiesOptions={specialtiesOptions ?? []}
          />
        </div>
      </div>
    </>
  )
}
