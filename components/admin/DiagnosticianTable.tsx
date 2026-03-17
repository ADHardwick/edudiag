'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Diagnostician } from '@/types'

interface Props {
  diagnosticians: Diagnostician[]
}

export function DiagnosticianTable({ diagnosticians: initial }: Props) {
  const [items, setItems] = useState(initial)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/diagnosticians/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((d) => d.id !== id))
  }

  async function togglePublished(id: string, current: boolean) {
    await fetch(`/api/admin/diagnosticians/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !current }),
    })
    setItems((prev) => prev.map((d) => d.id === id ? { ...d, is_published: !current } : d))
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-text-secondary">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Location</th>
            <th className="text-left px-4 py-3 font-medium">Specialties</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((d) => (
            <tr key={d.id} className="hover:bg-surface/50">
              <td className="px-4 py-3 font-medium text-text-primary">{d.name}</td>
              <td className="px-4 py-3 text-text-secondary">{[d.city, d.state].filter(Boolean).join(', ')}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {d.specialties?.slice(0, 2).map((s) => (
                    <span key={s.id} className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">{s.name}</span>
                  ))}
                  {(d.specialties?.length ?? 0) > 2 && (
                    <span className="text-xs text-text-secondary">+{(d.specialties?.length ?? 0) - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => togglePublished(d.id, d.is_published)}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    d.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {d.is_published ? 'Published' : 'Draft'}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/admin/diagnosticians/${d.id}`} className="text-primary hover:underline text-xs">Edit</Link>
                  <button onClick={() => handleDelete(d.id, d.name)} className="text-red-500 hover:underline text-xs">Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No diagnosticians yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
