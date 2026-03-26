type Insight = {
  title: string
  description: string
}

type InsightsCardProps = {
  insights: Insight[]
}

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Insights automáticos
        </h3>
        <p className="text-sm text-gray-500">
          Leituras rápidas do seu comportamento financeiro
        </p>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-gray-500">
          Ainda não há dados suficientes para gerar insights.
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={`${insight.title}-${index}`}
              className="rounded-2xl border border-gray-100 p-4"
            >
              <p className="font-semibold text-gray-900">{insight.title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}