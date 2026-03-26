'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { AttachmentPreviewModal } from '../../painel/components/attachment-preview-modal'

type Account = {
  id: string
  name: string
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
  account_id: string
  category_id?: string | null
  attachment_url?: string | null
  attachment_signed_url?: string | null
  installment_number?: number | null
  installment_total?: number | null
  installment_group_id?: string | null
  categories?: {
    name: string
  }[] | null
}

const initialFormState = {
  description: '',
  amount: '',
  type: 'receita' as 'receita' | 'despesa' | 'transferencia',
  status: 'pago' as 'previsto' | 'pago' | 'vencido',
  transactionDate: new Date().toISOString().slice(0, 10),
  accountId: '',
  categoryId: '',
}

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function LancamentosPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editInstallmentMode, setEditInstallmentMode] = useState<'single' | 'group'>('single')

  const [description, setDescription] = useState(initialFormState.description)
  const [amount, setAmount] = useState(initialFormState.amount)
  const [type, setType] = useState<
    'receita' | 'despesa' | 'transferencia'
  >(initialFormState.type)
  const [status, setStatus] = useState<
    'previsto' | 'pago' | 'vencido'
  >(initialFormState.status)
  const [transactionDate, setTransactionDate] = useState(
    initialFormState.transactionDate
  )
  const [accountId, setAccountId] = useState(initialFormState.accountId)
  const [categoryId, setCategoryId] = useState(initialFormState.categoryId)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentTotal, setInstallmentTotal] = useState('2')

  const [filterMonth, setFilterMonth] = useState(getCurrentMonthValue())
  const [filterType, setFilterType] = useState<
    'todos' | 'receita' | 'despesa' | 'transferencia'
  >('todos')
  const [filterStatus, setFilterStatus] = useState<
    'todos' | 'previsto' | 'pago' | 'vencido'
  >('todos')

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  async function loadPageData() {
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

    const [accountsResult, categoriesResult, transactionsResult] =
      await Promise.all([
        supabase
          .from('accounts')
          .select('id, name')
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
            'id, description, amount, type, status, transaction_date, account_id, category_id, attachment_url, installment_number, installment_total, installment_group_id, categories(name)'
          )
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false }),
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

    const loadedAccounts = (accountsResult.data ?? []) as Account[]
    const loadedCategories = (categoriesResult.data ?? []) as Category[]
    const rawTransactions = (transactionsResult.data ?? []) as Transaction[]

    const transactionsWithSignedUrl = await Promise.all(
      rawTransactions.map(async (item) => {
        if (!item.attachment_url) {
          return { ...item, attachment_signed_url: null }
        }

        const { data } = await supabase.storage
          .from('comprovantes')
          .createSignedUrl(item.attachment_url, 60 * 60)

        return {
          ...item,
          attachment_signed_url: data?.signedUrl ?? null,
        }
      })
    )

    setAccounts(loadedAccounts)
    setCategories(loadedCategories)
    setTransactions(transactionsWithSignedUrl)

    if (loadedAccounts.length > 0 && !accountId) {
      setAccountId(loadedAccounts[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPageData()
  }, [])

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (category) => category.type === type || category.type === 'ambos'
    )
  }, [categories, type])

  useEffect(() => {
    if (
      filteredCategories.length > 0 &&
      !filteredCategories.some((category) => category.id === categoryId)
    ) {
      setCategoryId(filteredCategories[0].id)
    }

    if (filteredCategories.length === 0) {
      setCategoryId('')
    }
  }, [filteredCategories, categoryId])

  function resetForm() {
    setEditingId(null)
    setEditInstallmentMode('single')
    setDescription(initialFormState.description)
    setAmount(initialFormState.amount)
    setType(initialFormState.type)
    setStatus(initialFormState.status)
    setTransactionDate(initialFormState.transactionDate)
    setCategoryId('')
    setAttachmentFile(null)
    setIsInstallment(false)
    setInstallmentTotal('2')

    if (accounts.length > 0) {
      setAccountId(accounts[0].id)
    } else {
      setAccountId('')
    }
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

    if (!accountId) {
      setError('Cadastre uma conta antes de criar lançamentos.')
      setSaving(false)
      return
    }

    let attachmentUrl: string | null = null

    if (attachmentFile) {
      const fileExt = attachmentFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/transactions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, attachmentFile, {
          upsert: false,
        })

      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }

      attachmentUrl = filePath
    }

    const baseAmount = Number(amount)

    if (isInstallment && type === 'despesa' && !editingId) {
      const total = Number(installmentTotal)

      if (!total || total < 2) {
        setError('Informe uma quantidade válida de parcelas.')
        setSaving(false)
        return
      }

      const installmentValue = Number((baseAmount / total).toFixed(2))
      const groupId = crypto.randomUUID()

      const baseDate = new Date(transactionDate + 'T00:00:00')

      const installments = Array.from({ length: total }, (_, index) => {
        const installmentDate = new Date(baseDate)
        installmentDate.setMonth(baseDate.getMonth() + index)

        return {
          user_id: user.id,
          account_id: accountId,
          category_id: categoryId || null,
          type,
          description: `${description} (${index + 1}/${total})`,
          amount: installmentValue,
          status,
          transaction_date: installmentDate.toISOString().slice(0, 10),
          attachment_url: index === 0 ? attachmentUrl : null,
          installment_number: index + 1,
          installment_total: total,
          installment_group_id: groupId,
        }
      })

      const { error } = await supabase.from('transactions').insert(installments)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const currentEditing = transactions.find((item) => item.id === editingId)

      if (
        editingId &&
        editInstallmentMode === 'group' &&
        currentEditing?.installment_group_id
      ) {
        const { error } = await supabase
          .from('transactions')
          .update({
            account_id: accountId,
            category_id: categoryId || null,
            type,
            status,
            attachment_url: attachmentUrl ?? undefined,
          })
          .eq('installment_group_id', currentEditing.installment_group_id)

        if (error) {
          setError(error.message)
          setSaving(false)
          return
        }
      }

      const payload = {
        user_id: user.id,
        account_id: accountId,
        category_id: categoryId || null,
        type,
        description,
        amount: baseAmount,
        status,
        transaction_date: transactionDate,
        attachment_url: attachmentUrl,
      }

      if (editingId) {
        const existingTransaction = transactions.find((item) => item.id === editingId)

        const updatePayload = {
          ...payload,
          attachment_url: attachmentUrl ?? existingTransaction?.attachment_url ?? null,
        }

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (error) {
          setError(error.message)
          setSaving(false)
          return
        }
      } else {
        const { error } = await supabase.from('transactions').insert(payload)

        if (error) {
          setError(error.message)
          setSaving(false)
          return
        }
      }
    }

    resetForm()
    await loadPageData()
    setSaving(false)
  }

  function handleEdit(transaction: Transaction) {
    setEditingId(transaction.id)
    setDescription(transaction.description)
    setAmount(String(transaction.amount))
    setType(transaction.type)
    setStatus(transaction.status)
    setTransactionDate(transaction.transaction_date)
    setAccountId(transaction.account_id)
    setCategoryId(transaction.category_id ?? '')
    setAttachmentFile(null)
    setIsInstallment(false)
    setInstallmentTotal(
      transaction.installment_total ? String(transaction.installment_total) : '2'
    )
    setEditInstallmentMode(
      transaction.installment_group_id ? 'group' : 'single'
    )

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    const transaction = transactions.find((item) => item.id === id)

    const wantsGroupDelete =
      transaction?.installment_group_id &&
      window.confirm('Deseja excluir todas as parcelas deste grupo? Clique OK para grupo inteiro ou Cancelar para apenas esta parcela.')

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

    let query = supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)

    if (wantsGroupDelete && transaction?.installment_group_id) {
      query = query.eq('installment_group_id', transaction.installment_group_id)
    } else {
      query = query.eq('id', id)
    }

    const { error } = await query

    if (error) {
      setError(error.message)
      setDeletingId(null)
      return
    }

    if (transaction?.attachment_url) {
      await supabase.storage
        .from('comprovantes')
        .remove([transaction.attachment_url])
    }

    if (editingId === id) {
      resetForm()
    }

    await loadPageData()
    setDeletingId(null)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const itemMonth = item.transaction_date.slice(0, 7)

      const matchMonth = filterMonth ? itemMonth === filterMonth : true
      const matchType = filterType === 'todos' ? true : item.type === filterType
      const matchStatus =
        filterStatus === 'todos' ? true : item.status === filterStatus

      return matchMonth && matchType && matchStatus
    })
  }, [transactions, filterMonth, filterType, filterStatus])

  const totalReceitasFiltradas = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === 'receita')
      .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)
  }, [filteredTransactions])

  const totalDespesasFiltradas = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === 'despesa')
      .reduce((acc, item) => acc + Number(item.amount ?? 0), 0)
  }, [filteredTransactions])

  function formatMoney(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <div>
      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        url={previewUrl}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lançamentos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre, edite, exclua e filtre receitas e despesas
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
              {editingId ? 'Editar lançamento' : 'Novo lançamento'}
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
                Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Salário, Mercado, Aluguel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Valor
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                onChange={(e) =>
                  setType(
                    e.target.value as 'receita' | 'despesa' | 'transferencia'
                  )
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                {filteredCategories.length === 0 ? (
                  <option value="">Nenhuma categoria compatível</option>
                ) : (
                  filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'previsto' | 'pago' | 'vencido')
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="pago">Pago</option>
                <option value="previsto">Previsto</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Conta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                required
              >
                {accounts.length === 0 ? (
                  <option value="">Nenhuma conta cadastrada</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Data
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                required
              />
            </div>

            {editingId ? (
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Edição de parcelas
                </p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={editInstallmentMode === 'single'}
                      onChange={() => setEditInstallmentMode('single')}
                    />
                    Apenas esta parcela
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={editInstallmentMode === 'group'}
                      onChange={() => setEditInstallmentMode('group')}
                    />
                    Aplicar no grupo
                  </label>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Lançamento parcelado
                  </span>
                </label>

                {isInstallment ? (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quantidade de parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={installmentTotal}
                      onChange={(e) => setInstallmentTotal(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Comprovante
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={saving || accounts.length === 0}
              className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving
                ? editingId
                  ? 'Atualizando...'
                  : 'Salvando...'
                : editingId
                ? 'Atualizar lançamento'
                : 'Salvar lançamento'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Histórico</h2>
            <p className="mt-1 text-sm text-gray-500">
              Filtre seus lançamentos por mês, tipo e status
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mês
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as
                      | 'todos'
                      | 'receita'
                      | 'despesa'
                      | 'transferencia'
                  )
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="todos">Todos</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as 'todos' | 'previsto' | 'pago' | 'vencido'
                  )
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="todos">Todos</option>
                <option value="pago">Pago</option>
                <option value="previsto">Previsto</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Receitas filtradas</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(totalReceitasFiltradas)}
              </h3>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Despesas filtradas</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(totalDespesasFiltradas)}
              </h3>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando lançamentos...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum lançamento encontrado para os filtros selecionados.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {item.description}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.transaction_date} • {item.status}
                        {item.categories?.[0]?.name
                          ? ` • ${item.categories[0].name}`
                          : ''}
                        {item.installment_number && item.installment_total
                          ? ` • Parcela ${item.installment_number}/${item.installment_total}`
                          : ''}
                      </p>

                      {item.attachment_url ? (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <p className="text-xs text-gray-500">
                            Comprovante anexado
                          </p>

                          {item.attachment_signed_url ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewUrl(item.attachment_signed_url ?? null)
                                  setPreviewOpen(true)
                                }}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Visualizar
                              </button>

                              <a
                                href={item.attachment_signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-gray-700 hover:underline"
                              >
                                Abrir em nova aba
                              </a>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="text-gray-900">
                        {item.type === 'despesa' ? '-' : '+'}
                        {formatMoney(Number(item.amount ?? 0))}
                      </strong>

                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
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