import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/server'

export async function POST(req: NextRequest) {
  try {
    const { priceType, userId, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId e email são obrigatórios.' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY não configurada na Vercel.' },
        { status: 500 }
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
              ? 'STRIPE_PRICE_YEARLY não configurado na Vercel.'
              : 'STRIPE_PRICE_MONTHLY não configurado na Vercel.',
        },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL não configurado na Vercel.' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

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

      // metadata da própria sessão
      metadata: {
        user_id: userId,
        price_type: priceType ?? 'monthly',
      },

      // metadata da assinatura
      subscription_data: {
        metadata: {
          user_id: userId,
          price_type: priceType ?? 'monthly',
        },
      },

      // ajuda como fallback
      client_reference_id: userId,
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