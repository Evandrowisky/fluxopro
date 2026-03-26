'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type CardAccount = {
  id: string
  name: string
  closing_day?: number | null
  due_day?: number | null
  credit_limit?: number | null
}

type Transaction = {
  id: string
  description: string
  amount: number
  transaction_date: string
  account_id: string
  status: string
}

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function FaturasPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [cards, setCards] = useState<CardAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não encontrado.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      setPlan((profile?.plan as 'free' | 'premium') ?? 'free')

      if (profile?.plan !== 'premium') {
        setLoading(false)
        return
      }

      const monthStart = `${selectedMonth}-01`
      const monthEnd = `${selectedMonth}-31`

      const [cardsResult, transactionsResult] = await Promise.all([
        supabase
          .from('accounts')
          .select('id, name, closing_day, due_day, credit_limit')
          .eq('user_id', user.id)
          .eq('type', 'cartao_credito')
          .order('created_at', { ascending: false }),

        supabase
          .from('transactions')
          .select('id, description, amount, transaction_date, account_id, status')
          .eq('user_id', user.id)
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd)
          .eq('type', 'despesa')
          .order('transaction_date', { ascending: false }),
      ])

      if (cardsResult.error) {
        setError(cardsResult.error.message)
        setLoading(false)
        return
      }

      if (transactionsResult.error) {
        setError(transactionsResult.error.message)
        setLoading(false)
        return
      }

      setCards((cardsResult.data ?? []) as CardAccount[])
      setTransactions((transactionsResult.data ?? []) as Transaction[])
      setLoading(false)
    }

    loadData()
  }, [supabase, selectedMonth])

  const cardsWithTotals = useMemo(() => {
    return cards.map((card) => {
      const total = transactions
        .filter((t) => t.account_id === card.id)
        .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)

      const available =
        card.credit_limit != null ? Number(card.credit_limit) - total : null

      return {
        ...card,
        total,
        available,
        items: transactions.filter((t) => t.account_id === card.id),
      }
    })
  }, [cards, transactions])

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando faturas...</p>
  }

  if (plan !== 'premium') {
    return (
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="text-xl font-semibold text-yellow-800">Recurso Premium</h2>
        <p className="mt-2 text-sm text-yellow-700">
          As faturas de cartão estão disponíveis apenas no plano Premium.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle das despesas nos cartões de crédito
          </p>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        />
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {cardsWithTotals.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Nenhum cartão de crédito cadastrado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {cardsWithTotals.map((card) => (
            <section key={card.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{card.name}</h2>
                  <p className="text-sm text-gray-500">
                    Fechamento: {card.closing_day ?? '-'} • Vencimento: {card.due_day ?? '-'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Fatura do mês</p>
                    <strong className="text-xl text-gray-900">
                      {formatMoney(card.total)}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Limite disponível</p>
                    <strong className="text-xl text-gray-900">
                      {card.available != null ? formatMoney(card.available) : '-'}
                    </strong>
                  </div>
                </div>
              </div>

              {card.items.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma despesa neste cartão para o mês selecionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {card.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-500">
                          {item.transaction_date} • {item.status}
                        </p>
                      </div>

                      <strong className="text-gray-900">
                        {formatMoney(Number(item.amount ?? 0))}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}