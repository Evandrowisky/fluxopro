'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Topbar } from '../components/dashboard/topbar'
import { SummaryCard } from '../components/dashboard/summary-card'
import { MonthlyChart } from '../components/dashboard/monthly-chart'
import { AccountsCard } from '../components/dashboard/accounts-card'
import { TransactionsCard } from '../components/dashboard/transactions-card'
import { CategoryChart } from '../components/dashboard/category-chart'
import { MonthlyBudgetCard } from '../components/dashboard/monthly-budget-card'
import { InsightsCard } from '../components/dashboard/insights-card'

type Account = {
  id: string
  name: string
  type: string
  current_balance: number
}

type Category = {
  id: string
  name: string
  type: 'receita' | 'despesa' | 'ambos'
}

type Transaction = {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa' | 'transferencia'
  status: 'previsto' | 'pago' | 'vencido'
  transaction_date: string
  category_id?: string | null
}

type Budget = {
  id: string
  month_ref: string
  amount: number
}

type Insight = {
  title: string
  description: string
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

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetAmount, setBudgetAmount] = useState(0)
  const [budgetInput, setBudgetInput] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue())

  useEffect(() => {
    async function loadDashboard() {
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

      setUserEmail(user.email ?? '')

      const selectedYear = Number(selectedMonth.slice(0, 4))
      const startOfYear = `${selectedYear}-01-01`
      const endOfYear = `${selectedYear}-12-31`

      const [accountsResult, categoriesResult, transactionsResult, budgetResult] =
        await Promise.all([
          supabase
            .from('accounts')
            .select('id, name, type, current_balance')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),

          supabase
            .from('categories')
            .select('id, name, type')
            .eq('user_id', user.id)
            .order('name', { ascending: true }),

          supabase
            .from('transactions')
            .select(
              'id, description, amount, type, status, transaction_date, category_id'
            )
            .eq('user_id', user.id)
            .gte('transaction_date', startOfYear)
            .lte('transaction_date', endOfYear)
            .order('transaction_date', { ascending: false }),

          supabase
            .from('budgets')
            .select('id, month_ref, amount')
            .eq('month_ref', selectedMonth)
            .maybeSingle(),
        ])

      if (accountsResult.error) {
        setError(accountsResult.error.message)
        setLoading(false)
        return
      }

      if (categoriesResult.error) {
        setError(categoriesResult.error.message)
        setLoading(false)
        return
      }

      if (transactionsResult.error) {
        setError(transactionsResult.error.message)
        setLoading(false)
        return
      }

      if (budgetResult.error) {
        setError(budgetResult.error.message)
        setLoading(false)
        return
      }

      setAccounts((accountsResult.data ?? []) as Account[])
      setCategories((categoriesResult.data ?? []) as Category[])
      setTransactions((transactionsResult.data ?? []) as Transaction[])

      const budget = budgetResult.data as Budget | null
      const currentBudgetAmount = Number(budget?.amount ?? 0)
      setBudgetAmount(currentBudgetAmount)
      setBudgetInput(currentBudgetAmount > 0 ? String(currentBudgetAmount) : '')

      setLoading(false)
    }

    loadDashboard()
  }, [supabase, selectedMonth])

  const selectedYear = Number(selectedMonth.slice(0, 4))
  const selectedMonthNumber = Number(selectedMonth.slice(5, 7)) - 1

  const transactionsThisMonth = useMemo(() => {
    return transactions.filter((item) => {
      const date = new Date(item.transaction_date)
      return (
        date.getMonth() === selectedMonthNumber &&
        date.getFullYear() === selectedYear
      )
    })
  }, [transactions, selectedMonthNumber, selectedYear])

  const saldoTotal = useMemo(() => {
    return accounts.reduce(
      (acc, item) => acc + Number(item.current_balance ?? 0),
      0
    )
  }, [accounts])

  const receitasMes = useMemo(() => {
    return transactionsThisMonth
      .filter((item) => item.type === 'receita' && item.status === 'pago')
      .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)
  }, [transactionsThisMonth])

  const despesasMes = useMemo(() => {
    return transactionsThisMonth
      .filter((item) => item.type === 'despesa' && item.status === 'pago')
      .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)
  }, [transactionsThisMonth])

  const resultadoMes = receitasMes - despesasMes

  const chartData = useMemo(() => {
    const labels = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]

    return labels.map((label, monthIndex) => {
      const monthTransactions = transactions.filter((item) => {
        const date = new Date(item.transaction_date)
        return (
          date.getMonth() === monthIndex &&
          date.getFullYear() === selectedYear
        )
      })

      const receitas = monthTransactions
        .filter((item) => item.type === 'receita' && item.status === 'pago')
        .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)

      const despesas = monthTransactions
        .filter((item) => item.type === 'despesa' && item.status === 'pago')
        .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)

      return {
        name: label,
        valor: receitas - despesas,
      }
    })
  }, [transactions, selectedYear])

  const despesasPorCategoria = useMemo(() => {
    const map = new Map<string, number>()

    transactionsThisMonth
      .filter((item) => item.type === 'despesa' && item.status === 'pago')
      .forEach((item) => {
        const category = categories.find((cat) => cat.id === item.category_id)
        const categoryName = category?.name || 'Sem categoria'

        map.set(
          categoryName,
          (map.get(categoryName) || 0) + Number(item.amount ?? 0)
        )
      })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactionsThisMonth, categories])

  const receitasPorCategoria = useMemo(() => {
    const map = new Map<string, number>()

    transactionsThisMonth
      .filter((item) => item.type === 'receita' && item.status === 'pago')
      .forEach((item) => {
        const category = categories.find((cat) => cat.id === item.category_id)
        const categoryName = category?.name || 'Sem categoria'

        map.set(
          categoryName,
          (map.get(categoryName) || 0) + Number(item.amount ?? 0)
        )
      })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactionsThisMonth, categories])

  const insights = useMemo<Insight[]>(() => {
  const result: Insight[] = []

  if (transactionsThisMonth.length === 0) {
    result.push({
      title: 'Sem movimentação no período',
      description:
        'Você ainda não registrou lançamentos no mês selecionado.',
    })
    return result
  }

  if (despesasMes > receitasMes) {
    result.push({
      title: 'Resultado negativo no mês',
      description:
        'Você gastou mais do que ganhou no mês selecionado.',
    })
  }

  if (receitasMes > 0 && despesasMes === 0) {
    result.push({
      title: 'Mês muito positivo',
      description:
        'Você registrou receitas, mas não tem despesas pagas neste período.',
    })
  }

  const maiorDespesaCategoria = despesasPorCategoria[0]
  if (maiorDespesaCategoria) {
    const shareMaiorDespesa =
      despesasMes > 0 ? (maiorDespesaCategoria.value / despesasMes) * 100 : 0

    result.push({
      title: 'Maior categoria de gasto',
      description: `${maiorDespesaCategoria.name} foi sua principal despesa, somando ${formatMoney(
        maiorDespesaCategoria.value
      )}.`,
    })

    if (shareMaiorDespesa >= 50) {
      result.push({
        title: 'Gasto muito concentrado',
        description: `${maiorDespesaCategoria.name} representa ${shareMaiorDespesa.toFixed(
          0
        )}% das suas despesas do mês.`,
      })
    }
  }

  const maiorReceitaCategoria = receitasPorCategoria[0]
  if (maiorReceitaCategoria) {
    const shareMaiorReceita =
      receitasMes > 0 ? (maiorReceitaCategoria.value / receitasMes) * 100 : 0

    if (shareMaiorReceita >= 70) {
      result.push({
        title: 'Receita concentrada',
        description: `${maiorReceitaCategoria.name} representa ${shareMaiorReceita.toFixed(
          0
        )}% das suas entradas do mês.`,
      })
    }
  }

  if (budgetAmount > 0) {
    const usage = (despesasMes / budgetAmount) * 100

    if (usage >= 100) {
      result.push({
        title: 'Meta excedida',
        description: `Você ultrapassou sua meta mensal de ${formatMoney(
          budgetAmount
        )}.`,
      })
    } else if (usage >= 80) {
      result.push({
        title: 'Meta próxima do limite',
        description: `Você já usou ${usage.toFixed(
          0
        )}% da sua meta mensal.`,
      })
    } else if (usage <= 50) {
      result.push({
        title: 'Meta sob controle',
        description: `Você usou apenas ${usage.toFixed(
          0
        )}% da sua meta mensal até agora.`,
      })
    }
  }

  const paidTransactions = transactionsThisMonth.filter(
    (item) => item.status === 'pago'
  )

  const averageTicket =
    paidTransactions.length > 0
      ? paidTransactions.reduce((acc, item) => acc + Number(item.amount ?? 0), 0) /
        paidTransactions.length
      : 0

  if (averageTicket > 0) {
    result.push({
      title: 'Ticket médio do mês',
      description: `Seu valor médio por lançamento pago está em ${formatMoney(
        averageTicket
      )}.`,
    })
  }

  const previousMonthDate = new Date(selectedYear, selectedMonthNumber - 1, 1)

  const previousMonthTransactions = transactions.filter((item) => {
    const date = new Date(item.transaction_date)
    return (
      date.getMonth() === previousMonthDate.getMonth() &&
      date.getFullYear() === previousMonthDate.getFullYear()
    )
  })

  const previousMonthReceitas = previousMonthTransactions
    .filter((item) => item.type === 'receita' && item.status === 'pago')
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)

  const previousMonthDespesas = previousMonthTransactions
    .filter((item) => item.type === 'despesa' && item.status === 'pago')
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)

  const previousMonthResult = previousMonthReceitas - previousMonthDespesas

  if (previousMonthTransactions.length > 0) {
    if (resultadoMes < previousMonthResult) {
      result.push({
        title: 'Queda no resultado',
        description:
          'Seu resultado ficou abaixo do mês anterior.',
      })
    } else if (resultadoMes > previousMonthResult) {
      result.push({
        title: 'Melhora no resultado',
        description:
          'Seu resultado melhorou em relação ao mês anterior.',
      })
    }
  }

  return result.slice(0, 6)
}, [
  transactionsThisMonth,
  transactions,
  despesasMes,
  receitasMes,
  despesasPorCategoria,
  receitasPorCategoria,
  budgetAmount,
  resultadoMes,
  selectedYear,
  selectedMonthNumber,
])

  async function handleSaveBudget() {
    setSavingBudget(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Usuário não encontrado.')
      setSavingBudget(false)
      return
    }

    const numericAmount = Number(budgetInput || 0)

    const { error } = await supabase.from('budgets').upsert(
      {
        user_id: user.id,
        month_ref: selectedMonth,
        amount: numericAmount,
      },
      {
        onConflict: 'user_id,month_ref',
      }
    )

    if (error) {
      setError(error.message)
      setSavingBudget(false)
      return
    }

    setBudgetAmount(numericAmount)
    setSavingBudget(false)
  }

  async function handleDeleteBudget() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir a meta do mês selecionado?'
    )

    if (!confirmed) return

    setSavingBudget(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Usuário não encontrado.')
      setSavingBudget(false)
      return
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id)
      .eq('month_ref', selectedMonth)

    if (error) {
      setError(error.message)
      setSavingBudget(false)
      return
    }

    setBudgetAmount(0)
    setBudgetInput('')
    setSavingBudget(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-600">Carregando dashboard...</p>
      </main>
    )
  }

  return (
    <div>
      <Topbar
        userEmail={userEmail}
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
      />

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Saldo total"
          value={formatMoney(saldoTotal)}
          subtitle="Soma das suas contas"
        />
        <SummaryCard
          title="Receitas do mês"
          value={formatMoney(receitasMes)}
          subtitle="Entradas pagas"
        />
        <SummaryCard
          title="Despesas do mês"
          value={formatMoney(despesasMes)}
          subtitle="Saídas pagas"
        />
        <SummaryCard
          title="Resultado do mês"
          value={formatMoney(resultadoMes)}
          subtitle="Receitas - despesas"
        />
      </section>

      <section className="mt-6 min-w-0">
        <MonthlyChart data={chartData} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <CategoryChart
          title="Despesas por categoria"
          subtitle="Distribuição das saídas do mês selecionado"
          data={despesasPorCategoria}
        />
        <CategoryChart
          title="Receitas por categoria"
          subtitle="Distribuição das entradas do mês selecionado"
          data={receitasPorCategoria}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Definir meta mensal
            </h3>
            <p className="text-sm text-gray-500">
              Configure o orçamento do mês selecionado
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="number"
              step="0.01"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Ex: 3000"
              className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <button
              onClick={handleSaveBudget}
              disabled={savingBudget}
              className="rounded-2xl bg-black px-4 py-3 text-white hover:opacity-90 disabled:opacity-60"
            >
              {savingBudget
                ? 'Salvando...'
                : budgetAmount > 0
                ? 'Atualizar meta'
                : 'Salvar meta'}
            </button>

            {budgetAmount > 0 ? (
              <button
                onClick={handleDeleteBudget}
                disabled={savingBudget}
                className="rounded-2xl border border-red-300 px-4 py-3 text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Excluir meta
              </button>
            ) : null}
          </div>
        </div>

        <MonthlyBudgetCard
          budgetAmount={budgetAmount}
          spentAmount={despesasMes}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <InsightsCard insights={insights} />
        <AccountsCard accounts={accounts} />
      </section>

      <section className="mt-6">
        <TransactionsCard transactions={transactionsThisMonth} />
      </section>
    </div>
  )
}