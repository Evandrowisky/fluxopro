'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Account = {
  id: string
  name: string
  type: string
  initial_balance: number
  current_balance: number
}

const initialFormState = {
  name: '',
  type: 'corrente',
  initialBalance: '0',
}

export default function ContasPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState(initialFormState.name)
  const [type, setType] = useState(initialFormState.type)
  const [initialBalance, setInitialBalance] = useState(initialFormState.initialBalance)

  async function loadAccounts() {
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
      .from('accounts')
      .select('id, name, type, initial_balance, current_balance')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setAccounts((data ?? []) as Account[])
    setLoading(false)
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  function resetForm() {
    setEditingId(null)
    setName(initialFormState.name)
    setType(initialFormState.type)
    setInitialBalance(initialFormState.initialBalance)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

    const balance = Number(initialBalance || 0)

    if (editingId) {
      const accountBeingEdited = accounts.find((item) => item.id === editingId)
      const currentBalanceDiff =
        Number(accountBeingEdited?.current_balance ?? 0) -
        Number(accountBeingEdited?.initial_balance ?? 0)

      const { error } = await supabase
        .from('accounts')
        .update({
          name,
          type,
          initial_balance: balance,
          current_balance: balance + currentBalanceDiff,
        })
        .eq('id', editingId)
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name,
        type,
        initial_balance: balance,
        current_balance: balance,
      })

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    resetForm()
    await loadAccounts()
    setSaving(false)
  }

  function handleEdit(account: Account) {
    setEditingId(account.id)
    setName(account.name)
    setType(account.type)
    setInitialBalance(String(account.initial_balance))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta conta? Isso pode afetar lançamentos vinculados.'
    )

    if (!confirmed) return

    setDeletingId(id)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Usuário não encontrado.')
      setDeletingId(null)
      return
    }

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
      setDeletingId(null)
      return
    }

    if (editingId === id) {
      resetForm()
    }

    await loadAccounts()
    setDeletingId(null)
  }

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre, edite e exclua suas contas financeiras
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Editar conta' : 'Nova conta'}
            </h2>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar edição
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nome da conta
              </label>
              <input
                type="text"
                placeholder="Ex: Nubank, Itaú, Carteira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="carteira">Carteira</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="investimento">Investimento</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Saldo inicial
              </label>
              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? 'Atualizando...'
                  : 'Salvando...'
                : editingId
                ? 'Atualizar conta'
                : 'Salvar conta'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Minhas contas
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando contas...</p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma conta cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.type}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <strong className="text-gray-900">
                        {formatMoney(Number(account.current_balance ?? 0))}
                      </strong>

                      <button
                        type="button"
                        onClick={() => handleEdit(account)}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(account.id)}
                        disabled={deletingId === account.id}
                        className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === account.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}