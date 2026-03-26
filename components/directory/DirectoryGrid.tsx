import Link from 'next/link'
import { DiagnosticianCard } from './DiagnosticianCard'
import type { Diagnostician } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
  total: number
  page: number
  limit: number
  searchParamsString?: string
}

export function DirectoryGrid({
  diagnosticians,
  total,
  page,
  limit,
  searchParamsString = '',
}: Props) {
  const totalPages = Math.ceil(total / limit)

  function buildPageUrl(p: number): string {
    const params = new URLSearchParams(searchParamsString)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  if (!diagnosticians.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg">No diagnosticians found.</p>
        <p className="text-sm mt-2">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-400 text-right mb-4">
        {total} result{total !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {diagnosticians.map((d) => (
          <DiagnosticianCard key={d.id} diagnostician={d} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageUrl(p)}
              className={`px-3 py-1.5 rounded text-sm font-semibold ${
                p === page
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
