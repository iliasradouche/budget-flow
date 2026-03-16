import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useGoals() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...values,
          target_amount: Number(values.target_amount),
          user_id: user.id,
          deadline: values.deadline || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase
        .from('goals')
        .update({
          ...values,
          target_amount: values.target_amount ? Number(values.target_amount) : undefined,
          deadline: values.deadline || null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useContributeToGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount, current_amount, target_amount }) => {
      const newAmount = Math.min(current_amount + Number(amount), target_amount)
      const status = newAmount >= target_amount ? 'completed' : 'active'

      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}
