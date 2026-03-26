'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Category = {
  id: string
  name: string
  type: 'receita' | 'despesa' | 'ambos'
}

const initialFormState = {
  name: '',
  type: 'despesa' as 'receita' | 'despesa' | 'ambos',
}

export default function CategoriasPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState(initialFormState.name)
  const [type, setType] = useState(initialFormState.type)

  async function loadCategories() {
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
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setCategories((data ?? []) as Category[])
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function resetForm() {
    setEditingId(null)
    setName(initialFormState.name)
    setType(initialFormState.type)
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

    if (editingId) {
      const { error } = await supabase
        .from('categories')
        .update({
          name,
          type,
        })
        .eq('id', editingId)
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name,
        type,
      })

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    resetForm()
    await loadCategories()
    setSaving(false)
  }

  function handleEdit(category: Category) {
    setEditingId(category.id)
    setName(category.name)
    setType(category.type)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta categoria? Lançamentos vinculados podem ficar sem categoria.'
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
      .from('categories')
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

    await loadCategories()
    setDeletingId(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crie, edite e exclua suas categorias financeiras
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
              {editingId ? 'Editar categoria' : 'Nova categoria'}
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
                Nome
              </label>
              <input
                type="text"
                placeholder="Ex: Alimentação, Salário, Transporte"
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
                onChange={(e) =>
                  setType(e.target.value as 'receita' | 'despesa' | 'ambos')
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="ambos">Ambos</option>
              </select>
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
                ? 'Atualizar categoria'
                : 'Salvar categoria'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Minhas categorias
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando categorias...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma categoria cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">{category.type}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === category.id ? 'Excluindo...' : 'Excluir'}
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