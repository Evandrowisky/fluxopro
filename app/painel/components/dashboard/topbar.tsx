'use client'

import { useRouter } from 'next/navigation'

type Props = {
  userEmail: string
  selectedMonth: string
  onChangeMonth: (value: string) => void
}

export function Topbar({ userEmail, selectedMonth, onChangeMonth }: Props) {
  const router = useRouter()

  const handleNovoLancamento = () => {
    router.push('/painel/lancamentos')
  }

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bem-vindo, {userEmail}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => onChangeMonth(e.target.value)}
          className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
        />

        <button
          onClick={handleNovoLancamento}
          className="rounded-2xl bg-black px-5 py-3 text-white font-medium hover:opacity-90 transition"
        >
          + Novo lançamento
        </button>
      </div>
    </div>
  )
}