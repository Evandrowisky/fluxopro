'use client'

import Link from 'next/link'
import { useState } from 'react'
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
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Enviamos o link de redefinição para seu e-mail.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-gray-900">Reset de senha</h1>
        <p className="mt-2 text-sm text-gray-500">
          Informe seu e-mail para receber o link de redefinição
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <div className="mt-6">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>

        <div className="mt-6 text-sm text-gray-600">
          <Link href="/login" className="hover:underline">
            Voltar para login
          </Link>
        </div>
      </form>
    </div>
  )
}