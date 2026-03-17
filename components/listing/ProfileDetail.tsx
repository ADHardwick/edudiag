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

interface Props { diagnostician: Diagnostician }

export function ProfileDetail({ diagnostician: d }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        {d.photo_url ? (
          <Image src={d.photo_url} alt={d.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center text-4xl text-text-secondary">
            {d.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-primary">{d.name}</h1>
          {(d.city || d.state) && <p className="text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</p>}
        </div>
      </div>

      {d.bio && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">About</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{d.bio}</p>
        </section>
      )}

      {d.specialties && d.specialties.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Specialties & Services</h2>
          <div className="flex flex-wrap gap-2">
            {d.specialties.map((s) => (
              <span key={s.id} className="bg-accent/10 text-accent text-sm px-3 py-1 rounded-full">{s.name}</span>
            ))}
          </div>
        </section>
      )}

      {d.service_area && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Service Area</h2>
          <p className="text-text-secondary text-sm">{d.service_area}</p>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Contact Information</h2>
        <div className="space-y-1 text-sm text-text-secondary">
          {d.phone && <p><span aria-hidden="true">📞</span> <a href={`tel:${d.phone}`} className="hover:text-primary">{d.phone}</a></p>}
          {d.email && <p><span aria-hidden="true">✉️</span> <a href={`mailto:${d.email}`} className="hover:text-primary">{d.email}</a></p>}
          {isSafeUrl(d.website) && <p><span aria-hidden="true">🌐</span> <a href={d.website!} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{d.website}</a></p>}
        </div>
      </section>
    </div>
  )
}
