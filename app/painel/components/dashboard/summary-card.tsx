type SummaryCardProps = {
  title: string
  value: string
  subtitle?: string
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-gray-900">{value}</h3>
      {subtitle ? <p className="mt-2 text-sm text-gray-400">{subtitle}</p> : null}
    </div>
  )
}