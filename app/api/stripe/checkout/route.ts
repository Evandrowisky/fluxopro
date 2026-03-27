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
    const { priceType, userId, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId e email são obrigatórios.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, plan_status, stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: `Erro ao buscar perfil: ${profileError.message}` },
        { status: 500 }
      )
    }

    const blockedStatuses = ['active', 'trialing', 'past_due', 'unpaid']

    // usuário já premium ativo
    if (profile?.plan === 'premium' && profile?.plan_status === 'active') {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura premium ativa.' },
        { status: 409 }
      )
    }

    // bloqueia múltiplas assinaturas vinculadas
    if (
      profile?.stripe_subscription_id &&
      profile?.plan_status &&
      blockedStatuses.includes(profile.plan_status)
    ) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura vinculada à sua conta.' },
        { status: 409 }
      )
    }

    const priceId =
      priceType === 'yearly'
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            priceType === 'yearly'
              ? 'STRIPE_PRICE_YEARLY não configurado.'
              : 'STRIPE_PRICE_MONTHLY não configurado.',
        },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL não configurado.' },
        { status: 500 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/painel/premium?success=1`,
      cancel_url: `${baseUrl}/painel/premium?canceled=1`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        price_type: priceType ?? 'monthly',
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          price_type: priceType ?? 'monthly',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('❌ Erro checkout Stripe:', error)

    return NextResponse.json(
      { error: error?.message || 'Erro ao criar sessão de pagamento.' },
      { status: 500 }
    )
  }
}