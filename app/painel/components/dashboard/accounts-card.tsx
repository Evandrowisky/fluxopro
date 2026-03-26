type Account = {
  id: string
  name: string
  type: string
  current_balance: number
}

type AccountsCardProps = {
  accounts: Account[]
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function AccountsCard({ accounts }: AccountsCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">Minhas contas</h3>

      {accounts.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 p-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{account.name}</p>
                <p className="text-sm text-gray-500">{account.type}</p>
              </div>
              <strong className="text-gray-900">
                {formatMoney(Number(account.current_balance ?? 0))}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}