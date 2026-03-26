'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { PlanBadge } from '../components/plan-badge'

export default function PremiumPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [error, setError] = useState('')

  async function loadProfile() {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Usuário não encontrado.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setPlan((data?.plan as 'free' | 'premium') ?? 'free')
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleCheckout(priceType: 'monthly' | 'yearly') {
    setSaving(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Usuário não encontrado.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType,
          userId: user.id,
          email: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        setError(data.error || 'Erro ao criar sessão de pagamento.')
        setSaving(false)
        return
      }

      window.location.href = data.url
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar sessão de pagamento.')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Premium</h1>
        <p className="mt-1 text-sm text-gray-500">
          Desbloqueie os recursos avançados do FluxoPro
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando plano...</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Seu plano atual
                </h2>
                <p className="text-sm text-gray-500">
                  Veja seu status atual de assinatura
                </p>
              </div>

              <PlanBadge plan={plan} />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Plano ativo</p>
              <strong className="text-2xl text-gray-900">
                {plan === 'premium' ? 'Premium' : 'Free'}
              </strong>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              O que você desbloqueia
            </h2>

            <div className="space-y-3">
              {[
                'Insights financeiros avançados',
                'Faturas de cartão de crédito',
                'Alertas inteligentes',
                'Lançamentos e categorias ilimitados',
                'Recursos premium futuros',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-100 p-4 text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>

            {plan === 'free' ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => handleCheckout('monthly')}
                  disabled={saving}
                  className="rounded-2xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Redirecionando...' : 'Assinar mensal'}
                </button>

                <button
                  onClick={() => handleCheckout('yearly')}
                  disabled={saving}
                  className="rounded-2xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {saving ? 'Redirecionando...' : 'Assinar anual'}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
                Seu plano premium está ativo.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}