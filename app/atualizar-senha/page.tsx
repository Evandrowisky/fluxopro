'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

export default function AtualizarSenhaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function checkRecoverySession() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setError('Erro ao validar sessão de recuperação.')
        setCheckingSession(false)
        return
      }

      if (!data.session) {
        setError('Link inválido ou expirado. Solicite uma nova redefinição de senha.')
        setCheckingSession(false)
        return
      }

      setCheckingSession(false)
    }

    checkRecoverySession()
  }, [supabase])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password || !confirmPassword) {
      setError('Preencha os dois campos de senha.')
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

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Senha atualizada com sucesso. Redirecionando para o login...')

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-10 shadow-sm">
        <h1 className="text-5xl font-bold text-gray-900">Nova senha</h1>
        <p className="mt-4 text-3xl text-gray-500">
          Digite sua nova senha e confirme para finalizar a redefinição
        </p>

        {checkingSession ? (
          <div className="mt-8 rounded-3xl border border-gray-300 bg-gray-50 px-6 py-5 text-2xl text-gray-700">
            Validando link de recuperação...
          </div>
        ) : (
          <>
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

            <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">
              <input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-3xl outline-none focus:border-black"
                required
              />

              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-3xl border border-gray-300 bg-slate-100 px-6 py-5 text-3xl outline-none focus:border-black"
                required
              />

              <button
                type="submit"
                disabled={loading || checkingSession}
                className="w-full rounded-3xl bg-black px-6 py-5 text-3xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Atualizar senha'}
              </button>
            </form>

            <div className="mt-8">
              <Link href="/login" className="text-2xl text-gray-600 hover:text-black">
                Voltar para login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}