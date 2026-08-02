'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface DataPoint {
  date: string
  amount: number
}

interface Props {
  data: DataPoint[]
}

export default function SpendOverTimeChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-52">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No data yet</p>
      </div>
    )
  }

  // Only label every ~5th tick to avoid crowding
  const tickInterval = Math.ceil(data.length / 6)

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            tickFormatter={(v) => formatShortDate(v)}
            interval={tickInterval}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Spent']}
            labelFormatter={(label) => formatShortDate(label)}
            contentStyle={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
              boxShadow: 'none',
            }}
            cursor={{ fill: 'var(--color-subtle)' }}
          />
          <Bar
            dataKey="amount"
            fill="var(--color-accent)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
