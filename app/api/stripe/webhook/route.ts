import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '../../../../lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
    return new NextResponse(`Webhook signature verification failed`, { status: 400 })
  }

  console.log('🔔 Evento Stripe recebido:', event.type)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      // Caso 1 e 2: O pagamento foi concluído com sucesso
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded': {
        const session = event.data.object as any

        // Tenta pegar o userId de múltiplos lugares (metadata do checkout ou da assinatura)
        const userId = session.metadata?.user_id || session.subscription_details?.metadata?.user_id
        
        const customerId = session.customer
        const subscriptionId = session.subscription

        console.log('Dados extraídos:', { userId, customerId, subscriptionId })

        // Se for checkout.session, verificamos se o pagamento já consta como 'paid'
        if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
          console.log('⏳ Sessão completada, mas pagamento ainda não confirmado (unpaid).')
          break
        }

        if (userId) {
          console.log(`🚀 Atualizando usuário ${userId} para Premium...`)
          
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
            console.error('❌ Erro Supabase:', error.message)
            return new NextResponse('Erro ao atualizar profile', { status: 500 })
          }

          console.log('✅ Perfil atualizado com sucesso!')
        } else {
          console.warn('⚠️ Evento ignorado: user_id não encontrado no metadata.')
        }
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

        if (error) console.error('Erro ao cancelar profile:', error)
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

        if (error) console.error('Erro ao atualizar subscription:', error)
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