import type { BloomLevel } from '../lib/types'

interface BloomBadgeProps {
  level: BloomLevel | null
}

const bloomConfig: Record<BloomLevel, { label: string; className: string }> = {
  onthouden: { label: 'Onthouden', className: 'bg-gray-200 text-gray-700' },
  begrijpen: { label: 'Begrijpen', className: 'bg-blue-100 text-blue-700' },
  toepassen: { label: 'Toepassen', className: 'bg-teal-100 text-teal-700' },
  analyseren: { label: 'Analyseren', className: 'bg-amber-100 text-amber-700' },
}

export default function BloomBadge({ level }: BloomBadgeProps) {
  if (!level) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
        -
      </span>
    )
  }

  const config = bloomConfig[level]
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
