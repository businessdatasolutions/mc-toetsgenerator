import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useExam } from '../hooks/useExam'
import { useQuestions } from '../hooks/useQuestions'
import type { QuestionWithAssessment } from '../hooks/useQuestions'
import type { BloomLevel } from '../lib/types'
import { supabase } from '../lib/supabase'
import Heatmap from '../components/Heatmap'
import QuestionCard from '../components/QuestionCard'
import ScoreBadge from '../components/ScoreBadge'

interface ScoreSummary {
  avg_bet_score: number | null
  avg_tech_score: number | null
  avg_val_score: number | null
}

export default function ExamDashboard() {
  const { exam, loading: examLoading, error: examError, examId } = useExam()
  const { questions, loading: questionsLoading, refetch } = useQuestions(examId)
  const [summary, setSummary] = useState<ScoreSummary | null>(null)
  const [filterMinScore, setFilterMinScore] = useState<number>(0)
  const [filterBloom, setFilterBloom] = useState<BloomLevel | ''>('')
  const [sortBy, setSortBy] = useState<'position' | 'bet' | 'tech' | 'val'>('position')

  // Fetch score summary via RPC (only when analysis is done)
  useEffect(() => {
    if (!examId || exam?.analysis_status !== 'completed') return
    async function fetchSummary() {
      const { data } = await supabase.rpc('exam_score_summary', {
        p_exam_id: examId!,
      })
      if (data && data.length > 0) {
        setSummary(data[0] as ScoreSummary)
      }
    }
    fetchSummary()
  }, [examId, exam?.analysis_status])

  // Refetch questions when analysis completes
  useEffect(() => {
    if (exam?.analysis_status === 'completed') {
      refetch()
    }
  }, [exam?.analysis_status])

  if (examLoading || questionsLoading) {
    return <p className="text-gray-500">Laden...</p>
  }

  if (examError) {
    return <p className="text-red-600">{examError}</p>
  }

  if (!exam) {
    return <p className="text-red-600">Toets niet gevonden</p>
  }

  const isProcessing = exam.analysis_status === 'processing'

  // Filter and sort questions
  const filtered = questions.filter((q) => {
    if (filterMinScore > 0) {
      const a = q.assessments?.[0]
      if (!a) return false
      const minScore = Math.min(
        a.bet_score ?? 6,
        a.tech_kwal_score ?? 6,
        a.val_score ?? 6
      )
      if (minScore > filterMinScore) return false
    }
    if (filterBloom) {
      const a = q.assessments?.[0]
      if (a?.val_cognitief_niveau !== filterBloom) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'position') return a.position - b.position
    const getScore = (q: QuestionWithAssessment) => {
      const as_ = q.assessments?.[0]
      if (!as_) return 0
      if (sortBy === 'bet') return as_.bet_score ?? 0
      if (sortBy === 'tech') return as_.tech_kwal_score ?? 0
      return as_.val_score ?? 0
    }
    return getScore(a) - getScore(b)
  })

  // Attention questions: any dimension <= 2
  const attentionQuestions = questions.filter((q) => {
    const a = q.assessments?.[0]
    if (!a) return false
    return (
      (a.bet_score !== null && a.bet_score <= 2) ||
      (a.tech_kwal_score !== null && a.tech_kwal_score <= 2) ||
      (a.val_score !== null && a.val_score <= 2)
    )
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          {exam.course && (
            <p className="text-gray-500 text-sm">{exam.course}</p>
          )}
        </div>
        <Link
          to={`/exams/${examId}/export`}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
        >
          Exporteren
        </Link>
      </div>

      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            Analyse wordt uitgevoerd... De resultaten verschijnen automatisch.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <p className="col-span-3 text-xs text-gray-400 text-right">Gemiddelde score (schaal 1-5)</p>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Betrouwbaarheid</p>
            <div className="flex justify-center">
              <ScoreBadge
                score={
                  summary.avg_bet_score !== null
                    ? Math.round(summary.avg_bet_score * 10) / 10
                    : null
                }
              />
            </div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Technisch</p>
            <div className="flex justify-center">
              <ScoreBadge
                score={
                  summary.avg_tech_score !== null
                    ? Math.round(summary.avg_tech_score * 10) / 10
                    : null
                }
              />
            </div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Validiteit</p>
            <div className="flex justify-center">
              <ScoreBadge
                score={
                  summary.avg_val_score !== null
                    ? Math.round(summary.avg_val_score * 10) / 10
                    : null
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {questions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Scoreoverzicht</h2>
          <Heatmap questions={questions} />
        </div>
      )}

      {/* Attention Questions */}
      {attentionQuestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-red-600">
            Aandachtsvragen ({attentionQuestions.length})
          </h2>
          <div className="space-y-2">
            {attentionQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} examId={examId!} />
            ))}
          </div>
        </div>
      )}

      {/* Filters and Question List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Alle vragen ({questions.length})
        </h2>

        <div className="flex gap-4 mb-4 items-center text-sm">
          <label className="flex items-center gap-1">
            Score ≤
            <select
              value={filterMinScore}
              onChange={(e) => setFilterMinScore(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={0}>Alle</option>
              <option value={2}>≤ 2</option>
              <option value={3}>≤ 3</option>
              <option value={4}>≤ 4</option>
            </select>
          </label>

          <label className="flex items-center gap-1">
            Bloom:
            <select
              value={filterBloom}
              onChange={(e) =>
                setFilterBloom(e.target.value as BloomLevel | '')
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Alle</option>
              <option value="onthouden">Onthouden</option>
              <option value="begrijpen">Begrijpen</option>
              <option value="toepassen">Toepassen</option>
              <option value="analyseren">Analyseren</option>
            </select>
          </label>

          <label className="flex items-center gap-1">
            Sorteer:
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'position' | 'bet' | 'tech' | 'val'
                )
              }
              className="border rounded px-2 py-1"
            >
              <option value="position">Volgorde</option>
              <option value="bet">Betrouwbaarheid</option>
              <option value="tech">Technisch</option>
              <option value="val">Validiteit</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          {sorted.map((q) => (
            <QuestionCard key={q.id} question={q} examId={examId!} />
          ))}
          {sorted.length === 0 && (
            <p className="text-gray-500 text-sm">
              Geen vragen gevonden met de huidige filters.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
