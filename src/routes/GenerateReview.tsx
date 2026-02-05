import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useGenerationJob } from '../hooks/useGenerationJob'
import ScoreBadge from '../components/ScoreBadge'
import BloomBadge from '../components/BloomBadge'
import type { Question, QuestionOption, Assessment } from '../lib/types'

interface QuestionWithAssessment extends Question {
  assessments: Assessment[]
}

export default function GenerateReview() {
  const { jobId } = useParams<{ jobId: string }>()
  const { job, loading: jobLoading } = useGenerationJob(jobId)
  const [questions, setQuestions] = useState<QuestionWithAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStem, setEditStem] = useState('')
  const [editOptions, setEditOptions] = useState<QuestionOption[]>([])

  // Fetch questions when job completes
  useEffect(() => {
    if (!job || job.status !== 'completed' || !job.result_question_ids?.length) {
      if (job && job.status !== 'pending' && job.status !== 'processing') {
        setLoading(false)
      }
      return
    }

    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*, assessments(*)')
        .in('id', job.result_question_ids)
        .order('position')

      if (data) setQuestions(data as QuestionWithAssessment[])
      setLoading(false)
    }

    fetchQuestions()
  }, [job])

  // 14.4c: Delete a question
  const handleDelete = async (questionId: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    }
  }

  // 14.4d: Start editing
  const startEdit = (question: QuestionWithAssessment) => {
    setEditingId(question.id)
    setEditStem(question.stem)
    setEditOptions([...question.options])
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditStem('')
    setEditOptions([])
  }

  const saveEdit = async (questionId: string) => {
    const { error } = await supabase
      .from('questions')
      .update({
        stem: editStem,
        options: editOptions,
      })
      .eq('id', questionId)

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, stem: editStem, options: editOptions }
            : q
        )
      )
      cancelEdit()
    }
  }

  // Loading / processing states
  if (jobLoading || (job && (job.status === 'pending' || job.status === 'processing'))) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Vragen worden gegenereerd...</h1>
        <p className="text-gray-500">
          De AI genereert vragen op basis van het studiemateriaal en voert
          kwaliteitscontrole uit.
        </p>
      </div>
    )
  }

  // Error state
  if (job?.status === 'failed') {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Generatie mislukt</h1>
        <p className="text-gray-700">
          {job.error_message || 'Er is een onbekende fout opgetreden.'}
        </p>
        <Link
          to="/generate"
          className="inline-block mt-4 text-blue-600 hover:underline"
        >
          Probeer opnieuw
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gegenereerde vragen beoordelen</h1>

      {loading ? (
        <p className="text-gray-500">Vragen laden...</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500">Geen vragen gegenereerd.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {questions.length} vragen gegenereerd. Beoordeel, bewerk of verwijder
            vragen voordat je ze accepteert.
          </p>

          <div className="space-y-4">
            {questions.map((question) => {
              const assessment = question.assessments?.[0] ?? null
              const isEditing = editingId === question.id

              return (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header: question number + scores */}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-gray-500 font-mono">
                      Vraag {question.position}
                    </span>
                    <div className="flex gap-1 items-center">
                      <ScoreBadge score={assessment?.bet_score ?? null} label="B" />
                      <ScoreBadge score={assessment?.tech_kwal_score ?? null} label="T" />
                      <ScoreBadge score={assessment?.val_score ?? null} label="V" />
                      <BloomBadge level={assessment?.val_cognitief_niveau ?? null} />
                    </div>
                  </div>

                  {isEditing ? (
                    /* 14.4d: Inline editor */
                    <div className="space-y-2">
                      <textarea
                        value={editStem}
                        onChange={(e) => setEditStem(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border text-sm"
                      />
                      {editOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={opt.is_correct}
                            onChange={() => {
                              setEditOptions((prev) =>
                                prev.map((o, j) => ({
                                  ...o,
                                  is_correct: j === i,
                                }))
                              )
                            }}
                            className="text-blue-600"
                          />
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              setEditOptions((prev) =>
                                prev.map((o, j) =>
                                  j === i ? { ...o, text: e.target.value } : o
                                )
                              )
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm px-3 py-1 border text-sm"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(question.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <>
                      <p className="text-gray-800">{question.stem}</p>
                      <ul className="space-y-1">
                        {question.options.map((opt, i) => (
                          <li
                            key={i}
                            className={`text-sm pl-4 ${
                              opt.is_correct
                                ? 'text-green-700 font-medium'
                                : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt.text}
                            {opt.is_correct && ' ✓'}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => startEdit(question)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 14.4e: Accept all & export */}
          {job?.exam_id && questions.length > 0 && (
            <div className="mt-6 flex gap-3">
              <Link
                to={`/exams/${job.exam_id}/export`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Alles accepteren & exporteren
              </Link>
              <Link
                to={`/exams/${job.exam_id}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Naar dashboard
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
