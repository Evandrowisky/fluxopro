import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '../../../../lib/stripe/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

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

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET não configurada')
    return new NextResponse('Webhook secret não configurada', { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('❌ Erro assinatura webhook:', err.message)
    return new NextResponse('Webhook signature verification failed', {
      status: 400,
    })
  }

  console.log('🔔 Evento Stripe recebido:', event.type)

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (err: any) {
    console.error('❌ Erro ao criar cliente Supabase:', err.message)
    return new NextResponse(err.message, { status: 500 })
  }

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

        console.log('📦 checkout.session.completed:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          userId,
          customerId,
          subscriptionId,
          metadata: session.metadata,
        })

        if (session.payment_status !== 'paid') {
          console.log('⏳ Sessão completada, mas pagamento ainda não confirmado.')
          break
        }

        if (!userId) {
          console.warn('⚠️ user_id não encontrado no checkout.session.completed')
          break
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            plan: 'premium',
            plan_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId)
          .select()

        console.log('🧾 Resultado update checkout:', {
          userId,
          customerId,
          subscriptionId,
          data,
          error,
        })

        if (error) {
          console.error('❌ Erro Supabase ao atualizar via checkout:', error)
          return new NextResponse(`Erro ao atualizar profile: ${error.message}`, {
            status: 500,
          })
        }

        console.log(`✅ Perfil ${userId} atualizado para Premium via checkout`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

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
          subscriptionId = typeof sub === 'string' ? sub : sub?.id || null
        }

        const invoiceUserId =
          invoice.parent &&
          'subscription_details' in invoice.parent
            ? invoice.parent.subscription_details?.metadata?.user_id || null
            : null

        console.log('💰 invoice.payment_succeeded:', {
          invoiceId: invoice.id,
          invoiceUserId,
          customerId,
          subscriptionId,
          subscriptionMetadata:
            invoice.parent &&
            'subscription_details' in invoice.parent
              ? invoice.parent.subscription_details?.metadata
              : null,
        })

        // 1º tenta atualizar por subscription_id
        if (subscriptionId) {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              plan: 'premium',
              plan_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('stripe_subscription_id', subscriptionId)
            .select()

          console.log('🧾 Resultado update invoice por subscription_id:', {
            subscriptionId,
            data,
            error,
          })

          if (!error && data && data.length > 0) {
            console.log('✅ Perfil atualizado via invoice usando subscription_id')
            break
          }
        }

        // 2º fallback: se o metadata da subscription tiver user_id, atualiza por id do usuário
        if (invoiceUserId) {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              plan: 'premium',
              plan_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', invoiceUserId)
            .select()

          console.log('🧾 Resultado update invoice por user_id:', {
            invoiceUserId,
            data,
            error,
          })

          if (error) {
            console.error('❌ Erro Supabase ao atualizar via invoice fallback:', error)
            return new NextResponse(`Erro ao atualizar profile: ${error.message}`, {
              status: 500,
            })
          }

          console.log('✅ Perfil atualizado via invoice usando user_id')
        } else {
          console.warn(
            '⚠️ invoice.payment_succeeded sem registro correspondente ainda. Ignorando sem quebrar.'
          )
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status

        console.log('🔄 customer.subscription.updated:', {
          id: subscription.id,
          status,
          metadata: subscription.metadata,
        })

        const { data, error } = await supabase
          .from('profiles')
          .update({
            plan: status === 'active' ? 'premium' : 'free',
            plan_status: status,
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()

        console.log('🧾 Resultado update subscription.updated:', {
          subscriptionId: subscription.id,
          data,
          error,
        })

        if (error) {
          console.error('❌ Erro ao atualizar subscription:', error)
          return new NextResponse(`Erro ao atualizar profile: ${error.message}`, {
            status: 500,
          })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('❌ customer.subscription.deleted:', {
          id: subscription.id,
        })

        const { data, error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            plan_status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)
          .select()

        console.log('🧾 Resultado update subscription.deleted:', {
          subscriptionId: subscription.id,
          data,
          error,
        })

        if (error) {
          console.error('❌ Erro ao cancelar profile:', error)
          return new NextResponse(`Erro ao atualizar profile: ${error.message}`, {
            status: 500,
          })
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