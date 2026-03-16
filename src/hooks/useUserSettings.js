import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useUserSettings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user_settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Row might not exist for existing users (before migration 003)
      if (error?.code === 'PGRST116') {
        const { data: created } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, currency: 'USD' })
          .select()
          .single()
        return created
      }

      if (error) throw error
      return data
    },
  })
}

export function useUpdateUserSettings() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (patch) => {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_settings'] }),
  })
}
