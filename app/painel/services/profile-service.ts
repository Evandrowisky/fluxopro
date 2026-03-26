import { createClient } from '../../../lib/supabase/client'

export type UserProfile = {
  id: string
  email: string | null
  full_name: string | null
  plan: 'free' | 'premium'
  plan_status: 'active' | 'inactive' | 'canceled' | 'past_due'
}

export async function getCurrentUserProfile() {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Usuário não encontrado.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, plan_status')
    .eq('id', user.id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: data as UserProfile,
    error: null,
  }
}

export async function isPremiumUser() {
  const result = await getCurrentUserProfile()

  if (!result.data) return false

  return (
    result.data.plan === 'premium' &&
    result.data.plan_status === 'active'
  )
}