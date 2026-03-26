type PlanBadgeProps = {
  plan: 'free' | 'premium'
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const isPremium = plan === 'premium'

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isPremium ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
      }`}
    >
      {isPremium ? 'Premium' : 'Free'}
    </span>
  )
}