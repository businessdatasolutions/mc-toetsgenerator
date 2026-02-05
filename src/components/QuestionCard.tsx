import { Link } from 'react-router'
import type { QuestionWithAssessment } from '../hooks/useQuestions'
import ScoreBadge from './ScoreBadge'
import BloomBadge from './BloomBadge'

interface QuestionCardProps {
  question: QuestionWithAssessment
  examId: string
}

export default function QuestionCard({ question, examId }: QuestionCardProps) {
  const assessment = question.assessments?.[0] ?? null
  const truncatedStem =
    question.stem.length > 80
      ? question.stem.slice(0, 80) + '...'
      : question.stem

  return (
    <Link
      to={`/exams/${examId}/questions/${question.id}`}
      className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-500 font-mono">
            #{question.position + 1}
          </span>
          <p className="text-sm mt-1 text-gray-800">{truncatedStem}</p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <div className="flex gap-1">
            <ScoreBadge score={assessment?.bet_score ?? null} label="B" />
            <ScoreBadge score={assessment?.tech_kwal_score ?? null} label="T" />
            <ScoreBadge score={assessment?.val_score ?? null} label="V" />
          </div>
          <BloomBadge level={assessment?.val_cognitief_niveau ?? null} />
        </div>
      </div>
    </Link>
  )
}
