type MonthlyBudgetCardProps = {
  budgetAmount: number
  spentAmount: number
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function MonthlyBudgetCard({
  budgetAmount,
  spentAmount,
}: MonthlyBudgetCardProps) {
  const progress =
    budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0

  const remaining = Math.max(budgetAmount - spentAmount, 0)
  const exceeded = spentAmount > budgetAmount

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Meta mensal</h3>
        <p className="text-sm text-gray-500">
          Controle do orçamento do mês selecionado
        </p>
      </div>

      {budgetAmount <= 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma meta definida para este mês.
        </p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Meta</p>
              <strong className="text-xl text-gray-900">
                {formatMoney(budgetAmount)}
              </strong>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Gasto atual</p>
              <strong className="text-xl text-gray-900">
                {formatMoney(spentAmount)}
              </strong>
            </div>
          </div>

          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full ${
                exceeded ? 'bg-red-500' : 'bg-black'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">{progress.toFixed(0)}% usado</span>
            <span className={exceeded ? 'text-red-600' : 'text-gray-600'}>
              {exceeded
                ? `Excedeu ${formatMoney(spentAmount - budgetAmount)}`
                : `Restam ${formatMoney(remaining)}`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}