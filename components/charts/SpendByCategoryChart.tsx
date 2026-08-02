'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DataPoint {
  name: string
  value: number
  color: string
  icon: string
}

interface Props {
  data: DataPoint[]
}

export default function SpendByCategoryChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-52">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No data yet</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Spent']}
            contentStyle={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
              boxShadow: 'none',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: 'var(--color-ink-2)', fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
