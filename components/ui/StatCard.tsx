import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  danger?: boolean
}

export default function StatCard({ label, value, sub, accent, danger }: StatCardProps) {
  return (
    <div className={cn(
      'card',
      accent && 'border-0',
      danger && 'border-0'
    )}
      style={
        accent ? { background: 'var(--color-accent)', color: 'white' }
        : danger ? { background: 'var(--color-danger-light)' }
        : {}
      }
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-1"
        style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'var(--color-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-semibold tracking-tight"
        style={{ color: accent ? 'white' : danger ? 'var(--color-danger)' : 'var(--color-ink)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1"
          style={{ color: accent ? 'rgba(255,255,255,0.65)' : 'var(--color-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
