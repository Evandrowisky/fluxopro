'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type NotificationItem = {
  id: string
  title: string
  description: string | null
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificacoesPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  async function loadNotifications() {
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

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, description, type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setNotifications((data ?? []) as NotificationItem[])
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function markAsRead(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    await loadNotifications()
  }

  async function deleteNotification(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    await loadNotifications()
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando alertas...</p>
  }

  if (plan !== 'premium') {
    return (
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="text-xl font-semibold text-yellow-800">Recurso Premium</h2>
        <p className="mt-2 text-sm text-yellow-700">
          Os alertas inteligentes estão disponíveis apenas no plano Premium.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Histórico de notificações do sistema
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {notifications.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Nenhum alerta registrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 ${
                item.is_read
                  ? 'border-gray-100 bg-white'
                  : 'border-black bg-gray-50'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description || 'Sem descrição'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{item.created_at}</p>
                </div>

                <div className="flex gap-3">
                  {!item.is_read ? (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Marcar como lido
                    </button>
                  ) : null}

                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}