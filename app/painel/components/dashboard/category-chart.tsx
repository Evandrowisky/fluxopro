'use client'

import { PieChart, Pie, Cell, Tooltip } from 'recharts'

type CategoryChartProps = {
  title: string
  subtitle: string
  data: { name: string; value: number }[]
}

const COLORS = [
  '#111827',
  '#374151',
  '#6B7280',
  '#9CA3AF',
  '#D1D5DB',
  '#4B5563',
]

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function CategoryChart({
  title,
  subtitle,
  data,
}: CategoryChartProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum dado categorizado neste período.
        </p>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="overflow-x-auto">
            <PieChart width={320} height={260}>
              <Pie
                data={data}
                cx={160}
                cy={130}
                outerRadius={90}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
              />
            </PieChart>
          </div>

          <div className="flex-1 space-y-3">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>

                <strong className="text-gray-900">
                  {formatMoney(item.value)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}