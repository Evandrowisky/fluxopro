'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Sidebar } from './components/sidebar'

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router, supabase])

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Verificando acesso...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 md:p-8 md:pb-28 lg:pb-8">
        <div className="mx-auto max-w-7xl min-w-0">
          {children}
        </div>
      </main>
    </div>
  )
}