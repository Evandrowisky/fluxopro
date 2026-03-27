import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan, plan_status')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Erro ao buscar perfil: ${error.message}` },
        { status: 500 }
      )
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Cliente Stripe não encontrado para este usuário.' },
        { status: 404 }
      )
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/painel/premium`

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('❌ Erro ao criar sessão do portal:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao abrir portal do Stripe.' },
      { status: 500 }
    )
  }
}