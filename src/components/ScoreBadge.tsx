interface ScoreBadgeProps {
  score: number | null
  label?: string
}

function getBadgeClass(score: number): string {
  if (score <= 2) return 'bg-red-500'
  if (score === 3) return 'bg-yellow-500'
  return 'bg-green-500'
}

export default function ScoreBadge({ score, label }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">
        {label ? `${label}: -` : '-'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${getBadgeClass(score)}`}
    >
      {label ? `${label}: ${score}` : score}
    </span>
  )
}
