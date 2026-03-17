import Image from 'next/image'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

interface Props {
  diagnostician: Diagnostician
}

export function DiagnosticianCard({ diagnostician: d }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {d.photo_url ? (
          <Image src={d.photo_url} alt={d.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-2xl text-text-secondary flex-shrink-0">
            {d.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-text-primary">{d.name}</h3>
          {(d.city || d.state) && (
            <p className="text-sm text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>
      {d.specialties && d.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {d.specialties.slice(0, 3).map((s) => (
            <span key={s.id} className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{s.name}</span>
          ))}
          {d.specialties.length > 3 && (
            <span className="text-xs text-text-secondary self-center">+{d.specialties.length - 3} more</span>
          )}
        </div>
      )}
      {d.bio && <p className="text-sm text-text-secondary line-clamp-2">{d.bio}</p>}
      <Link
        href={`/diagnosticians/${d.slug}`}
        aria-label={`View profile for ${d.name}`}
        className="mt-auto inline-block text-center bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        View Profile
      </Link>
    </div>
  )
}
