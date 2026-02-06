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
  const { questions, setQuestions, loading: questionsLoading, refetch } = useQuestions(examId)
  const [summary, setSummary] = useState<ScoreSummary | null>(null)
  const [filterMinScore, setFilterMinScore] = useState<number>(0)
  const [filterBloom, setFilterBloom] = useState<BloomLevel | ''>('')
  const [sortBy, setSortBy] = useState<'position' | 'bet' | 'tech' | 'val'>('position')
  const [actionError, setActionError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addStem, setAddStem] = useState('')
  const [addOptions, setAddOptions] = useState(['', '', '', ''])
  const [addCorrect, setAddCorrect] = useState(0)
  const [addSaving, setAddSaving] = useState(false)
  const [reassessingId, setReassessingId] = useState<string | null>(null)

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

  const refreshSummary = async () => {
    if (!examId) return
    const { data } = await supabase.rpc('exam_score_summary', {
      p_exam_id: examId,
    })
    if (data && data.length > 0) {
      setSummary(data[0] as ScoreSummary)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    setActionError(null)
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      setActionError('Verwijderen mislukt. Probeer het opnieuw.')
    } else {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      refreshSummary()
    }
  }

  const handleDuplicateQuestion = async (questionId: string) => {
    setActionError(null)
    const source = questions.find((q) => q.id === questionId)
    if (!source || !examId) return

    const { error } = await supabase.from('questions').insert({
      exam_id: examId,
      stem: source.stem,
      options: source.options,
      correct_option: source.correct_option,
      bloom_level: source.bloom_level,
      learning_goal: source.learning_goal,
      position: questions.length,
      version: 1,
    })

    if (error) {
      setActionError('Dupliceren mislukt. Probeer het opnieuw.')
    } else {
      refetch()
    }
  }

  const handleAddQuestion = async () => {
    if (!examId || !addStem.trim()) return
    setAddSaving(true)
    setActionError(null)

    const options = addOptions.map((text, i) => ({
      text,
      position: i,
      is_correct: i === addCorrect,
    }))

    const { error } = await supabase.from('questions').insert({
      exam_id: examId,
      stem: addStem,
      options,
      correct_option: addCorrect,
      position: questions.length,
      version: 1,
    })

    if (error) {
      setActionError('Toevoegen mislukt. Probeer het opnieuw.')
    } else {
      setShowAddForm(false)
      setAddStem('')
      setAddOptions(['', '', '', ''])
      setAddCorrect(0)
      refetch()
    }
    setAddSaving(false)
  }

  const handleReassessQuestion = async (questionId: string) => {
    if (!examId) return
    setReassessingId(questionId)
    setActionError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setActionError('Niet ingelogd. Log opnieuw in.')
        setReassessingId(null)
        return
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ exam_id: examId, question_id: questionId }),
        }
      )

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        setActionError(errBody.error ?? 'Herbeoordeling mislukt.')
        setReassessingId(null)
        return
      }

      // Poll for new assessment
      const startTime = Date.now()
      const question = questions.find((q) => q.id === questionId)
      const currentVersion = question?.version ?? 1
      const oldCreatedAt = question?.assessments?.[0]?.created_at ?? ''

      const poll = setInterval(async () => {
        const { data } = await supabase
          .from('assessments')
          .select('created_at')
          .eq('question_id', questionId)
          .eq('question_version', currentVersion)
          .order('created_at', { ascending: false })
          .limit(1)

        if (data && data.length > 0 && data[0].created_at > oldCreatedAt) {
          clearInterval(poll)
          setReassessingId(null)
          refetch()
          refreshSummary()
        }

        if (Date.now() - startTime > 60000) {
          clearInterval(poll)
          setActionError('Herbeoordeling duurt te lang. Ververs de pagina later.')
          setReassessingId(null)
        }
      }, 2000)
    } catch {
      setActionError('Herbeoordeling mislukt.')
      setReassessingId(null)
    }
  }

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

      {actionError && (
        <p className="text-red-600 mb-4">{actionError}</p>
      )}

      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-700 font-medium">
              Analyse wordt uitgevoerd...
            </p>
            {exam.question_count > 0 && (
              <span className="text-blue-600 text-sm">
                Vraag {exam.questions_analyzed} van {exam.question_count} geanalyseerd
              </span>
            )}
          </div>
          {exam.question_count > 0 && (
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round((exam.questions_analyzed / exam.question_count) * 100)}%`,
                }}
              />
            </div>
          )}
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
              <QuestionCard
                key={q.id}
                question={q}
                examId={examId!}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
                onReassess={handleReassessQuestion}
                reassessingId={reassessingId}
              />
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
            <QuestionCard
              key={q.id}
              question={q}
              examId={examId!}
              onDelete={handleDeleteQuestion}
              onDuplicate={handleDuplicateQuestion}
              onReassess={handleReassessQuestion}
              reassessingId={reassessingId}
            />
          ))}
          {sorted.length === 0 && (
            <p className="text-gray-500 text-sm">
              Geen vragen gevonden met de huidige filters.
            </p>
          )}
        </div>

        {/* Add Question */}
        {showAddForm ? (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Nieuwe vraag toevoegen</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stam</label>
                <textarea
                  value={addStem}
                  onChange={(e) => setAddStem(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  placeholder="Voer de vraagtekst in..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opties</label>
                {addOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="add-correct"
                      checked={addCorrect === i}
                      onChange={() => setAddCorrect(i)}
                    />
                    <span className="font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        setAddOptions((prev) =>
                          prev.map((o, j) => (j === i ? e.target.value : o))
                        )
                      }
                      className="flex-1 px-2 py-1 border rounded"
                      placeholder={`Optie ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddQuestion}
                  disabled={addSaving || !addStem.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {addSaving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setAddStem('')
                    setAddOptions(['', '', '', ''])
                    setAddCorrect(0)
                  }}
                  className="px-4 py-2 text-sm bg-white text-gray-700 border rounded hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50"
          >
            + Vraag toevoegen
          </button>
        )}
      </div>
    </div>
  )
}
