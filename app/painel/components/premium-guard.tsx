type PremiumGuardProps = {
  isPremium: boolean
  children: React.ReactNode
  title?: string
}

export function PremiumGuard({
  isPremium,
  children,
  title = 'Recurso premium',
}: PremiumGuardProps) {
  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
      <h3 className="text-lg font-semibold text-yellow-800">{title}</h3>
      <p className="mt-2 text-sm text-yellow-700">
        Este recurso está disponível apenas no plano Premium.
      </p>
    </div>
  )
}