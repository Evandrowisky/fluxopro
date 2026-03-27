'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

export default function ResetSenhaPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Enviamos o link de redefinição para seu e-mail.')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-10 shadow-sm">
        <h1 className="text-5xl font-bold text-gray-900">Reset de senha</h1>
        <p className="mt-4 text-3xl text-gray-500">
          Informe seu e-mail para receber o link de redefinição
        </p>

        {success && (
          <div className="mt-8 rounded-3xl border border-green-300 bg-green-50 px-6 py-5 text-3xl text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-3xl border border-red-300 bg-red-50 px-6 py-5 text-3xl text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="mt-8 space-y-8">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-4xl outline-none focus:border-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-black px-6 py-5 text-4xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <div className="mt-8">
          <Link href="/login" className="text-2xl text-gray-600 hover:text-black">
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}