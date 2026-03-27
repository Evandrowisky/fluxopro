import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '../../../../lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Stripe webhook ativo em /api/stripe/webhook',
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('❌ Missing stripe-signature')
    return new NextResponse('Missing stripe-signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Erro assinatura webhook:', err.message)
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  console.log('🔔 Evento Stripe recebido:', event.type)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId =
          session.metadata?.user_id ||
          session.client_reference_id ||
          null

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || null

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null

        console.log('📦 Checkout concluído:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          userId,
          customerId,
          subscriptionId,
        })

        if (session.payment_status !== 'paid') {
          console.log('⏳ Sessão completada, mas pagamento ainda não confirmado.')
          break
        }

        if (!userId) {
          console.warn('⚠️ user_id não encontrado no checkout.session.completed')
          break
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'premium',
            plan_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Erro Supabase ao atualizar via checkout:', error.message)
          return new NextResponse('Erro ao atualizar profile', { status: 500 })
        }

        console.log(`✅ Perfil ${userId} atualizado para Premium via checkout`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        const userId =
          invoice.parent?.subscription_details?.metadata?.user_id ||
          invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ||
          null

        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || null

        let subscriptionId: string | null = null

        if (
          invoice.parent &&
          'subscription_details' in invoice.parent &&
          invoice.parent.subscription_details?.subscription
        ) {
          const sub = invoice.parent.subscription_details.subscription

          subscriptionId =
            typeof sub === 'string'
              ? sub
              : sub?.id || null
        }

        console.log('💰 Invoice paga:', {
          invoiceId: invoice.id,
          userId,
          customerId,
          subscriptionId,
        })

        if (!userId) {
          console.warn('⚠️ user_id não encontrado no invoice.payment_succeeded')
          break
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'premium',
            plan_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Erro Supabase ao atualizar via invoice:', error.message)
          return new NextResponse('Erro ao atualizar profile', { status: 500 })
        }

        console.log(`✅ Perfil ${userId} atualizado para Premium via invoice`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('❌ Assinatura deletada:', subscription.id)

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            plan_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Erro ao cancelar profile:', error.message)
        } else {
          console.log('✅ Perfil rebaixado para free')
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status

        console.log('🔄 Assinatura atualizada:', subscription.id, status)

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: status === 'active' ? 'premium' : 'free',
            plan_status: status,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Erro ao atualizar subscription:', error.message)
        } else {
          console.log('✅ Status da assinatura atualizado com sucesso')
        }

        break
      }

      default:
        console.log('ℹ️ Evento sem ação definida:', event.type)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erro geral webhook:', error.message)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}