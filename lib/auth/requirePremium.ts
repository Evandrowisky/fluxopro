import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function requirePremium(userId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_status, stripe_subscription_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Erro ao validar plano: ${error.message}`)
  }

  const allowed =
    data?.plan === 'premium' &&
    ['active', 'trialing'].includes(data.plan_status)

  return {
    allowed,
    profile: data,
  }
}