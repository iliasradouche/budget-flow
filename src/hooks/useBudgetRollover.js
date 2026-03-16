import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBudgetRollovers(month) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['rollovers', user?.id, month],
    enabled: !!user && !!month,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_rollovers')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
      if (error) throw error
      // Return as a map: category_id -> rollover_amount
      return Object.fromEntries((data ?? []).map(r => [r.category_id, r.rollover_amount]))
    },
  })
}

/**
 * Computes and stores rollover amounts for the current month.
 * Called once per month when the dashboard loads.
 * Logic: for each rollover-enabled category, find last month's underspend,
 * store it as a positive rollover (extra budget) or negative (overspend clamp to 0).
 */
export async function computeAndStoreRollovers(userId, categories) {
  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const lastMonth = format(subMonths(now, 1), 'yyyy-MM')
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

  const rolloverCats = categories.filter(c => c.enable_rollover && c.budget_limit && c.type === 'expense')
  if (!rolloverCats.length) return

  // Check which ones already have a rollover entry for current month
  const { data: existing } = await supabase
    .from('budget_rollovers')
    .select('category_id')
    .eq('user_id', userId)
    .eq('month', currentMonth)

  const alreadyDone = new Set((existing ?? []).map(r => r.category_id))
  const toCompute = rolloverCats.filter(c => !alreadyDone.has(c.id))
  if (!toCompute.length) return

  // Fetch last month's spending per category
  const { data: txns } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', lastMonthStart)
    .lte('date', lastMonthEnd)
    .in('category_id', toCompute.map(c => c.id))

  const spendMap = {}
  for (const t of txns ?? []) {
    spendMap[t.category_id] = (spendMap[t.category_id] ?? 0) + t.amount
  }

  const rows = toCompute.map(c => {
    const spent = spendMap[c.id] ?? 0
    const underspend = c.budget_limit - spent
    return {
      user_id: userId,
      category_id: c.id,
      month: currentMonth,
      rollover_amount: Math.max(underspend, 0), // never carry over a deficit
    }
  })

  await supabase.from('budget_rollovers').upsert(rows, { onConflict: 'category_id,month' })
}

export function useUpdateRolloverSetting() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, enable_rollover }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ enable_rollover })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['rollovers'] })
    },
  })
}
