import { useState } from 'react'
import type { QuestionWithAssessment } from '../hooks/useQuestions'

interface HeatmapProps {
  questions: QuestionWithAssessment[]
}

type SortColumn = 'position' | 'bet' | 'tech' | 'val'
type SortDir = 'asc' | 'desc'

function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100'
  if (score === 1) return 'bg-red-600 text-white'
  if (score === 2) return 'bg-red-400 text-white'
  if (score === 3) return 'bg-yellow-400 text-gray-900'
  if (score === 4) return 'bg-green-400 text-white'
  return 'bg-green-600 text-white'
}

function getScore(
  q: QuestionWithAssessment,
  col: 'bet' | 'tech' | 'val'
): number | null {
  const a = q.assessments?.[0]
  if (!a) return null
  if (col === 'bet') return a.bet_score
  if (col === 'tech') return a.tech_kwal_score
  return a.val_score
}

export default function Heatmap({ questions }: HeatmapProps) {
  const [sortCol, setSortCol] = useState<SortColumn>('position')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sorted = [...questions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'position') return (a.position - b.position) * dir
    const scoreA = getScore(a, sortCol) ?? 0
    const scoreB = getScore(b, sortCol) ?? 0
    return (scoreA - scoreB) * dir
  })

  const columns: { key: SortColumn; label: string }[] = [
    { key: 'position', label: '#' },
    { key: 'bet', label: 'B' },
    { key: 'tech', label: 'T' },
    { key: 'val', label: 'V' },
  ]

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="px-3 py-2 border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 text-center select-none"
            >
              {col.label}
              {sortCol === col.key && (
                <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((q) => (
          <tr key={q.id}>
            <td className="px-3 py-2 border border-gray-200 text-center font-mono">
              {q.position + 1}
            </td>
            {(['bet', 'tech', 'val'] as const).map((dim) => {
              const score = getScore(q, dim)
              return (
                <td
                  key={dim}
                  className={`px-3 py-2 border border-gray-200 text-center font-bold ${getScoreColor(score)}`}
                >
                  {score ?? '-'}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
