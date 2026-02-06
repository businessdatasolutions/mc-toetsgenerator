import { Link } from 'react-router'
import type { QuestionWithAssessment } from '../hooks/useQuestions'
import ScoreBadge from './ScoreBadge'
import BloomBadge from './BloomBadge'

interface QuestionCardProps {
  question: QuestionWithAssessment
  examId: string
  onDelete?: (questionId: string) => void
  onDuplicate?: (questionId: string) => void
  onReassess?: (questionId: string) => void
  reassessingId?: string | null
}

export default function QuestionCard({ question, examId, onDelete, onDuplicate, onReassess, reassessingId }: QuestionCardProps) {
  const assessment = question.assessments?.[0] ?? null
  const truncatedStem =
    question.stem.length > 80
      ? question.stem.slice(0, 80) + '...'
      : question.stem

  return (
    <div className="flex items-center border rounded-lg hover:shadow-md transition-shadow">
      <Link
        to={`/exams/${examId}/questions/${question.id}`}
        className="flex-1 p-4 min-w-0"
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
      {(onDuplicate || onDelete || onReassess) && (
        <div className="flex flex-col gap-1 pr-3 shrink-0">
          {onReassess && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReassess(question.id)
              }}
              disabled={reassessingId === question.id}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Herbeoordelen"
              aria-label={`Herbeoordeel vraag ${question.position + 1}`}
            >
              {reassessingId === question.id ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(question.id)
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Vraag dupliceren"
              aria-label={`Dupliceer vraag ${question.position + 1}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`Vraag ${question.position + 1} verwijderen? De bijbehorende analyse wordt ook verwijderd.`)) {
                  onDelete(question.id)
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Vraag verwijderen"
              aria-label={`Verwijder vraag ${question.position + 1}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
