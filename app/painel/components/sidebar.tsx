'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

const items = [
  { href: '/painel/dashboard', label: 'Dashboard' },
  { href: '/painel/contas', label: 'Contas' },
  { href: '/painel/lancamentos', label: 'Lançamentos' },
  { href: '/painel/categorias', label: 'Categorias' },
  { href: '/painel/faturas', label: 'Faturas' },
  { href: '/painel/notificacoes', label: 'Alertas' },
  { href: '/painel/premium', label: 'Premium' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div className="border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900">FluxoPro</h1>
        <p className="mt-1 text-sm text-gray-500">Seu financeiro premium</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {items.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}