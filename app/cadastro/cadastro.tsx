'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function CadastroPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.')

    setTimeout(() => {
      router.push('/login')
    }, 2500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-10 shadow-sm">
        <h1 className="text-5xl font-bold text-gray-900">Criar conta</h1>
        <p className="mt-4 text-3xl text-gray-500">
          Cadastre-se para acessar sua conta no FluxoPro
        </p>

        {success && (
          <div className="mt-8 rounded-3xl border border-green-300 bg-green-50 px-6 py-5 text-2xl text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-3xl border border-red-300 bg-red-50 px-6 py-5 text-2xl text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCadastro} className="mt-8 space-y-6">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-3xl outline-none focus:border-black"
            required
          />

          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-3xl outline-none focus:border-black"
            required
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-3xl outline-none focus:border-black"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-black px-6 py-5 text-3xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
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