import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

interface Props {
  diagnostician: Diagnostician
}

export function DiagnosticianCard({ diagnostician: d }: Props) {
  const initial = d.name.charAt(0)
  const location = [d.city, d.state].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-all hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:ring-indigo-200">
      {/* Dark header */}
      <div
        className="p-5 flex items-center gap-3.5"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        {d.photo_url ? (
          <Image
            src={d.photo_url}
            alt={d.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-extrabold text-white border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initial}
          </div>
        )}
        <div>
          <p className="text-white font-bold text-base leading-tight">{d.name}</p>
          {location && <p className="text-indigo-300 text-xs mt-0.5">📍 {location}</p>}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 pb-5 flex flex-col gap-3">
        {d.specialties && d.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.specialties.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className="bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold px-2.5 py-0.5"
              >
                {s.name}
              </span>
            ))}
            {d.specialties.length > 3 && (
              <span className="text-xs text-slate-400 self-center">
                +{d.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
        {d.bio && (
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{d.bio}</p>
        )}
        <Link
          href={`/diagnosticians/${d.slug}`}
          aria-label={`View profile for ${d.name}`}
          className="block text-center text-white text-sm font-bold py-2.5 rounded-lg mt-auto"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
