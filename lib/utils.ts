import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, addDays, addMonths, addWeeks, addYears } from 'date-fns'
import type { BillingCycle } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format as Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM')
}

export function formatMonthYear(date: string | Date): string {
  return format(new Date(date), 'MMM yyyy')
}

// Calculate daily savings target for a goal
export function getDailyTarget(
  targetAmount: number,
  currentAmount: number,
  targetDate: string
): { dailyTarget: number; daysLeft: number; isAchievable: boolean } {
  const daysLeft = differenceInDays(new Date(targetDate), new Date())
  const remaining = targetAmount - currentAmount

  if (daysLeft <= 0) {
    return { dailyTarget: 0, daysLeft: 0, isAchievable: remaining <= 0 }
  }

  const dailyTarget = remaining / daysLeft
  return {
    dailyTarget: Math.max(0, dailyTarget),
    daysLeft,
    isAchievable: remaining <= 0,
  }
}

// Advance a subscription's next billing date by one cycle
export function getNextBillingDate(
  currentDate: string,
  cycle: BillingCycle
): string {
  const date = new Date(currentDate)
  switch (cycle) {
    case 'weekly':
      return format(addWeeks(date, 1), 'yyyy-MM-dd')
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd')
    case 'yearly':
      return format(addYears(date, 1), 'yyyy-MM-dd')
  }
}

// Get the current month date range
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
  const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')
  return { start, end }
}

// Get past N days range
export function getLastNDaysRange(n: number): { start: string; end: string } {
  const end = new Date()
  const start = addDays(end, -n)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}
