'use client'

import { formatCurrency, getDailyTarget } from '@/lib/utils'
import type { SavingsGoal } from '@/types'

interface Props {
  goal: SavingsGoal
}

export default function GoalProgressRing({ goal }: Props) {
  const percent = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
  const { dailyTarget, daysLeft, isAchievable } = getDailyTarget(
    goal.target_amount,
    goal.current_amount,
    goal.target_date
  )

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent / 100)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={isAchievable ? 'var(--color-success)' : 'var(--color-accent)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            {Math.round(percent)}%
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>saved</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1">
        <h3 className="font-semibold text-base mb-0.5" style={{ color: 'var(--color-ink)' }}>
          {goal.name}
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
          {formatCurrency(goal.current_amount)}{' '}
          <span style={{ color: 'var(--color-border)' }}>of</span>{' '}
          {formatCurrency(goal.target_amount)}
        </p>

        {isAchievable ? (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            🎉 Goal achieved!
          </div>
        ) : daysLeft > 0 ? (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>
            Save{' '}
            <strong>{formatCurrency(dailyTarget)}/day</strong>
            {' '}for the next{' '}
            <strong>{daysLeft} days</strong>
            {' '}to hit your goal.
          </div>
        ) : (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
            Target date has passed.
          </div>
        )}
      </div>
    </div>
  )
}
