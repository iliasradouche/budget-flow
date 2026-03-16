import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addWeeks, addMonths, addYears, parseISO, isToday, isBefore, format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── CRUD ────────────────────────────────────────────────────────────────────

export function useRecurringTransactions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recurring', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddRecurring() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: user.id,
          amount: Number(values.amount),
          type: values.type,
          category_id: values.category_id || null,
          note: values.note || null,
          interval_type: values.interval_type,
          next_date: values.next_date,
          is_active: true,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({
          ...values,
          amount: Number(values.amount),
          category_id: values.category_id || null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

export function useToggleRecurring() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

// ── AUTO-PROCESSOR ───────────────────────────────────────────────────────────

function computeNextDate(current, intervalType) {
  const d = parseISO(current)
  switch (intervalType) {
    case 'weekly':  return format(addWeeks(d, 1), 'yyyy-MM-dd')
    case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd')
    case 'yearly':  return format(addYears(d, 1), 'yyyy-MM-dd')
    default:        return current
  }
}

/**
 * Processes all due recurring transactions for the current user.
 * Returns the number of transactions generated.
 */
export async function processRecurring(userId) {
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch all active recurring entries due today or earlier
  const { data: due, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_date', today)

  if (error || !due?.length) return 0

  let generated = 0

  for (const r of due) {
    // Insert the actual transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: r.amount,
      type: r.type,
      category_id: r.category_id,
      note: r.note,
      date: r.next_date,
    })

    if (txError) continue

    // Advance next_date
    const newNextDate = computeNextDate(r.next_date, r.interval_type)
    await supabase
      .from('recurring_transactions')
      .update({ next_date: newNextDate })
      .eq('id', r.id)

    generated++
  }

  return generated
}
