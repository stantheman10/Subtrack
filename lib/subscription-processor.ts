import { format } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getNextBillingDate } from './utils'
import type { Subscription } from '@/types'

/**
 * Processes all due subscriptions for the current user.
 * Called client-side on dashboard/app load — inserts a transaction
 * for each subscription whose next_billing_date is today or earlier,
 * then advances next_billing_date by one billing cycle.
 */
export async function processDueSubscriptions(supabase: SupabaseClient): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch subscriptions that are due
  const { data: dueSubs, error } = await supabase
    .from('subscriptions')
    .select('*, category:categories(*)')
    .lte('next_billing_date', today)
    .eq('is_active', true)

  if (error || !dueSubs || dueSubs.length === 0) return

  for (const sub of dueSubs as Subscription[]) {
    // Walk through each missed billing date until caught up
    let billingDate = sub.next_billing_date

    while (billingDate <= today) {
      // Insert transaction for this billing date
      await supabase.from('transactions').insert({
        user_id: sub.user_id,
        category_id: sub.category_id,
        amount: sub.amount,
        description: sub.name,
        transaction_date: billingDate,
        type: 'expense',
        source: 'subscription',
        subscription_id: sub.id,
      })

      billingDate = getNextBillingDate(billingDate, sub.billing_cycle)
    }

    // Update subscription to new next billing date
    await supabase
      .from('subscriptions')
      .update({ next_billing_date: billingDate })
      .eq('id', sub.id)
  }
}
