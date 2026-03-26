type Transaction = {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa' | 'transferencia'
  status: 'previsto' | 'pago' | 'vencido'
  transaction_date: string
}

type TransactionsCardProps = {
  transactions: Transaction[]
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function TransactionsCard({ transactions }: TransactionsCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">Últimos lançamentos</h3>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum lançamento neste mês.</p>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 p-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.description}</p>
                <p className="text-sm text-gray-500">
                  {item.transaction_date} • {item.status}
                </p>
              </div>

              <strong className="text-gray-900">
                {item.type === 'despesa' ? '-' : '+'}
                {formatMoney(Number(item.amount ?? 0))}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}