'use client'
import { useState } from 'react'
import Link from 'next/link'

interface LeadSummary {
  id: string
  diagnostician_id: string | null
  diagnostician_name: string
  parent_name: string
  parent_email: string
  created_at: string
}

interface Props {
  leads: LeadSummary[]
  diagnosticianOptions: { id: string; name: string }[]
}

export function LeadsTable({ leads, diagnosticianOptions }: Props) {
  const [filter, setFilter] = useState('')

  const filtered = filter ? leads.filter((l) => l.diagnostician_id === filter) : leads

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="diag-filter" className="block text-xs font-medium text-text-secondary mb-1">Filter by Diagnostician</label>
        <select
          id="diag-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All Diagnosticians</option>
          {diagnosticianOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <caption className="sr-only">Leads</caption>
          <thead className="bg-surface text-text-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Parent</th>
              <th className="text-left px-4 py-3 font-medium">Diagnostician</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">{l.parent_name}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {l.diagnostician_name}
                  {!l.diagnostician_id && <span className="ml-1 text-xs text-gray-400">(deleted)</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{l.parent_email}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(l.created_at).toLocaleDateString('en-US')}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="text-primary hover:underline text-xs">View</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
