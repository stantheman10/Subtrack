export type TransactionType = 'expense' | 'income'
export type TransactionSource = 'manual' | 'subscription'
export type BillingCycle = 'weekly' | 'monthly' | 'yearly'
export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string
  transaction_date: string
  type: TransactionType
  source: TransactionSource
  subscription_id: string | null
  created_at: string
  // joined
  category?: Category
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string | null
  billing_cycle: BillingCycle
  next_billing_date: string
  start_date: string
  is_active: boolean
  created_at: string
  // joined
  category?: Category
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  created_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  amount: number
  contributed_at: string
}

export interface Settings {
  id: string
  user_id: string
  monthly_budget: number
  created_at: string
  updated_at: string
}
