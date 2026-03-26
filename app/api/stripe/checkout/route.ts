import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/server'

export async function POST(req: NextRequest) {
  try {
    const { priceType, userId, email } = await req.json()

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY não configurada no .env.local' },
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
              ? 'STRIPE_PRICE_YEARLY não configurado no .env.local'
              : 'STRIPE_PRICE_MONTHLY não configurado no .env.local',
        },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL não configurado no .env.local' },
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/painel/premium?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/painel/premium?canceled=1`,
      metadata: {
        user_id: userId,
        price_type: priceType,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erro checkout Stripe:', error)

    return NextResponse.json(
      { error: error?.message || 'Erro ao criar sessão de pagamento.' },
      { status: 500 }
    )
  }
}