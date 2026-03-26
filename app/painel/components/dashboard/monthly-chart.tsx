'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type MonthlyChartProps = {
  data: { name: string; valor: number }[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Evolução mensal</h3>
        <p className="text-sm text-gray-500">
          Visão consolidada dos seus resultados
        </p>
      </div>

      <div className="overflow-x-auto">
        <AreaChart
          width={900}
          height={300}
          data={data}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="#111827"
            fill="#d1d5db"
          />
        </AreaChart>
      </div>
    </div>
  )
}