import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions(filters = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (filters.type) query = query.eq('type', filters.type)
      if (filters.category_id) query = query.eq('category_id', filters.category_id)
      if (filters.from) query = query.gte('date', filters.from)
      if (filters.to) query = query.lte('date', filters.to)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useAddTransaction() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...values,
          amount: Number(values.amount),
          user_id: user.id,
          category_id: values.category_id || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ ...values, amount: Number(values.amount), category_id: values.category_id || null })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}
