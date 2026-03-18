interface Props {
  label: string
  value: number | string
}

export function StatCard({ label, value }: Props) {
  return (
    <div role="group" aria-label={label} className="bg-white rounded-xl border border-border p-6">
      <p className="text-sm text-text-secondary mb-1" aria-hidden="true">{label}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  )
}
