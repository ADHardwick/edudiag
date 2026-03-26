import Image from 'next/image'
import type { Diagnostician } from '@/types'

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

interface Props {
  diagnostician: Diagnostician
}

export function ProfileDetail({ diagnostician: d }: Props) {
  const location = [d.city, d.state].filter(Boolean).join(', ')
  const initial = d.name.charAt(0)

  return (
    <>
      {/* Dark header band */}
      <div
        className="p-6 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        {d.photo_url ? (
          <Image
            src={d.photo_url}
            alt={d.name}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initial}
          </div>
        )}
        <div className="pt-1">
          <h1 className="text-xl font-bold text-white">{d.name}</h1>
          {location && (
            <p className="text-indigo-300 text-sm mt-0.5">📍 {location}</p>
          )}
          {d.specialties && d.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {d.specialties.map((s) => (
                <span
                  key={s.id}
                  className="bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold px-2.5 py-0.5 border border-indigo-500/30"
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* White body */}
      <div className="p-8 space-y-6">
        {/* 1. Bio */}
        {d.bio && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-2">About</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{d.bio}</p>
          </section>
        )}

        {/* 2. Contact — moved up, pill-style links */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Contact Information</h2>
          <div className="flex flex-wrap gap-2">
            {d.phone && (
              <a
                href={`tel:${d.phone}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                📞 {d.phone}
              </a>
            )}
            {d.email && (
              <a
                href={`mailto:${d.email}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                ✉️ {d.email}
              </a>
            )}
            {isSafeUrl(d.website) && (
              <a
                href={d.website!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                🌐 {d.website}
              </a>
            )}
          </div>
        </section>

        {/* 3. Service area */}
        {d.service_area && (
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-2">Service Area</h2>
            <p className="text-slate-500 text-sm">{d.service_area}</p>
          </section>
        )}
      </div>
    </>
  )
}
