interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-medium mb-1" style={{ color: 'var(--color-ink)' }}>{title}</h3>
      <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--color-muted)' }}>{description}</p>
      {action}
    </div>
  )
}
