import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import type { RepairPlan, ValidationResponse } from '../lib/types'

interface ParsedOption {
  text: string
  position: number
  is_correct: boolean
}

interface ParsedQuestion {
  stem: string
  options: ParsedOption[]
  question_id?: string
  category?: string
  bloom_level?: string
  learning_goal?: string
}

const SIDECAR_URL = import.meta.env.VITE_SIDECAR_URL ?? 'http://localhost:8000'

export default function ExamParsing() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Validation state
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] =
    useState<ValidationResponse | null>(null)
  const [validationDirty, setValidationDirty] = useState(false)

  // Repair state
  const [repairing, setRepairing] = useState(false)
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null)
  const [repairSelections, setRepairSelections] = useState<
    Record<number, boolean>
  >({})

  useEffect(() => {
    async function loadAndParse() {
      if (!examId) return
      setLoading(true)
      try {
        // Get the uploaded file from storage
        const { data: files } = await supabase.storage
          .from('uploads')
          .list(examId)

        if (!files || files.length === 0) {
          setError('Geen bestand gevonden voor deze toets')
          return
        }

        const filename = files[0].name
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('uploads')
          .download(`${examId}/${filename}`)

        if (downloadError || !fileData) {
          setError('Fout bij downloaden van bestand')
          return
        }

        // Send to sidecar for parsing
        const formData = new FormData()
        formData.append('file', fileData, filename)

        const response = await fetch(`${SIDECAR_URL}/parse`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.detail || 'Parsing mislukt')
        }

        const parsed: ParsedQuestion[] = await response.json()
        // Ensure every question has a question_id
        const withIds = parsed.map((q, i) => ({
          ...q,
          question_id: q.question_id ?? String(i + 1),
        }))
        setQuestions(withIds)

        // Auto-validate immediately after parsing; skip to analysis if all valid
        const result = await handleValidate(withIds)
        if (result?.is_valid) {
          await handleSaveAndAnalyze(withIds)
          return
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      } finally {
        setLoading(false)
      }
    }

    loadAndParse()
  }, [examId])

  // Mark validation as dirty when questions change
  const updateQuestions = (
    updater: (prev: ParsedQuestion[]) => ParsedQuestion[]
  ) => {
    setQuestions(updater)
    if (validationResult) {
      setValidationDirty(true)
    }
  }

  const handleStemChange = (index: number, value: string) => {
    updateQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, stem: value } : q))
    )
  }

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    updateQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oIndex ? { ...o, text: value } : o
              ),
            }
          : q
      )
    )
  }

  const handleCorrectChange = (qIndex: number, oIndex: number) => {
    updateQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => ({
                ...o,
                is_correct: j === oIndex,
              })),
            }
          : q
      )
    )
  }

  const handleCategoryChange = (index: number, value: string) => {
    updateQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, category: value } : q))
    )
  }

  const handleDeleteQuestion = (index: number) => {
    if (!window.confirm(`Vraag ${index + 1} verwijderen?`)) return
    updateQuestions((prev) => prev.filter((_, i) => i !== index))
    setEditingIndex((prev) => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
  }

  const handleAddQuestion = () => {
    const newQuestion: ParsedQuestion = {
      stem: '',
      options: [0, 1, 2, 3].map((pos) => ({
        text: '',
        position: pos,
        is_correct: pos === 0,
      })),
      question_id: String(questions.length + 1),
      category: '',
    }
    updateQuestions((prev) => [...prev, newQuestion])
    setEditingIndex(questions.length)
  }

  const handleValidate = async (questionsToValidate?: ParsedQuestion[]): Promise<ValidationResponse | null> => {
    const qs = questionsToValidate ?? questions
    setValidating(true)
    setError(null)
    try {
      const response = await fetch(`${SIDECAR_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: qs }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Validatie mislukt')
      }

      const result: ValidationResponse = await response.json()
      setValidationResult(result)
      setValidationDirty(false)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validatie mislukt')
      return null
    } finally {
      setValidating(false)
    }
  }

  const handleRepair = async () => {
    if (!validationResult) return
    setRepairing(true)
    setError(null)
    try {
      const response = await fetch(`${SIDECAR_URL}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          validation: validationResult,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'AI reparatie mislukt')
      }

      const plan: RepairPlan = await response.json()
      setRepairPlan(plan)
      // Default: all proposals selected
      const selections: Record<number, boolean> = {}
      plan.proposals.forEach((_, idx) => {
        selections[idx] = true
      })
      setRepairSelections(selections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI reparatie mislukt')
    } finally {
      setRepairing(false)
    }
  }

  const handleApplyRepairs = async () => {
    if (!repairPlan) return

    // Apply selected proposals to questions
    updateQuestions((prev) => {
      const updated = [...prev.map((q) => ({ ...q }))]
      for (let i = 0; i < repairPlan.proposals.length; i++) {
        if (!repairSelections[i]) continue
        const proposal = repairPlan.proposals[i]
        const q = updated[proposal.question_index]
        if (!q) continue

        if (proposal.field === 'stem') {
          q.stem = proposal.proposed_value
        } else if (proposal.field === 'category') {
          q.category = proposal.proposed_value
        } else if (proposal.field === 'bloom_level') {
          q.bloom_level = proposal.proposed_value
        } else if (proposal.field === 'learning_goal') {
          q.learning_goal = proposal.proposed_value
        } else if (proposal.field.startsWith('option_')) {
          const optIndex = 'abcd'.indexOf(proposal.field.slice(-1))
          if (optIndex >= 0 && optIndex < q.options.length) {
            q.options = q.options.map((o, j) =>
              j === optIndex ? { ...o, text: proposal.proposed_value } : o
            )
          }
        } else if (proposal.field === 'correct_option') {
          const correctIndex = 'ABCD'.indexOf(proposal.proposed_value.toUpperCase())
          if (correctIndex >= 0 && correctIndex < q.options.length) {
            q.options = q.options.map((o, j) => ({
              ...o,
              is_correct: j === correctIndex,
            }))
          }
        }
      }
      return updated
    })

    setRepairPlan(null)
    setRepairSelections({})

    // Auto re-validate after applying
    // Small delay to let state settle
    setTimeout(() => handleValidate(), 100)
  }

  const handleCancelRepair = () => {
    setRepairPlan(null)
    setRepairSelections({})
  }

  const handleSaveAndAnalyze = async (questionsToSave?: ParsedQuestion[]) => {
    if (!examId) return
    const qs = questionsToSave ?? questions
    setSaving(true)
    setError(null)

    try {
      const questionRows = qs.map((q, i) => ({
        exam_id: examId,
        stem: q.stem,
        options: q.options,
        correct_option: q.options.findIndex((o) => o.is_correct),
        position: i,
        version: 1,
        category: q.category || null,
        bloom_level: q.bloom_level?.toLowerCase() || null,
        learning_goal: q.learning_goal || null,
      }))

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionRows)

      if (insertError) throw insertError

      // Trigger analysis via Edge Function
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      if (token) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ exam_id: examId }),
          }
        )
      }

      navigate(`/exams/${examId}`, { state: { validationSuccess: true } })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? (err as { message: string }).message
            : 'Opslaan mislukt'
      )
    } finally {
      setSaving(false)
    }
  }

  // Helpers
  const getQuestionValidation = (index: number) =>
    validationResult?.results.find((r) => r.question_index === index)

  const canSave =
    validationResult !== null &&
    validationResult.is_valid &&
    !validationDirty &&
    questions.length > 0

  if (loading) {
    return <p className="text-gray-500">{validating ? 'Vragen worden gevalideerd...' : 'Bestand wordt verwerkt...'}</p>
  }

  if (error && questions.length === 0) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vragen verwerken</h1>

      <p className="text-gray-600 mb-4">
        {questions.length} vragen gevonden. Klik op een rij om te bewerken.
      </p>

      {/* Validation summary banner */}
      {validationResult && !validationDirty && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            validationResult.is_valid
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {validationResult.is_valid ? '\u2713' : '\u2717'}
            </span>
            <span className="font-medium">
              {validationResult.valid_count} van {validationResult.total_questions}{' '}
              vragen geldig
            </span>
          </div>
          {!validationResult.is_valid && (
            <p className="mt-1 text-sm">
              {validationResult.invalid_count} vraag/vragen met fouten.
              Corrigeer de fouten en valideer opnieuw.
            </p>
          )}
        </div>
      )}

      {/* Top-level warnings banner */}
      {validationResult &&
        !validationDirty &&
        validationResult.warnings &&
        validationResult.warnings.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800">
            {validationResult.warnings.map((w, i) => (
              <p key={i} className="text-sm">
                {w}
              </p>
            ))}
          </div>
        )}

      {/* Dirty validation notice */}
      {validationDirty && (
        <div className="mb-4 p-3 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800">
          <span className="font-medium">
            Gegevens gewijzigd — valideer opnieuw
          </span>
        </div>
      )}

      <table className="w-full border-collapse border border-gray-200 mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left w-12">#</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Stam</th>
            <th className="border border-gray-200 px-4 py-2 text-left w-40">
              Categorie
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center w-20">
              Opties
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left w-44">
              Correct
            </th>
            {validationResult && !validationDirty && (
              <th className="border border-gray-200 px-4 py-2 text-center w-16">
                Status
              </th>
            )}
            <th className="border border-gray-200 px-4 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const qv = getQuestionValidation(i)
            return (
              <tr
                key={i}
                className={`hover:bg-gray-50 cursor-pointer ${
                  qv && !qv.is_valid && !validationDirty
                    ? 'bg-red-50'
                    : ''
                }`}
                onClick={() => setEditingIndex(editingIndex === i ? null : i)}
              >
                <td className="border border-gray-200 px-4 py-2">{i + 1}</td>
                <td className="border border-gray-200 px-4 py-2">
                  {editingIndex === i ? (
                    <input
                      type="text"
                      value={q.stem}
                      onChange={(e) => handleStemChange(i, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 border rounded"
                    />
                  ) : (
                    <span className="truncate block max-w-md">
                      {q.stem.length > 80 ? q.stem.slice(0, 80) + '...' : q.stem}
                    </span>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {editingIndex === i ? (
                    <input
                      type="text"
                      value={q.category ?? ''}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Onderwerp..."
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">
                      {q.category || (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </span>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2 text-center">
                  {q.options.length}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {q.options.find((o) => o.is_correct)?.text.slice(0, 30) ?? '-'}
                </td>
                {validationResult && !validationDirty && (
                  <td className="border border-gray-200 px-4 py-2 text-center">
                    {qv?.is_valid ? (
                      <span className="text-green-600" title="Geldig">
                        {'\u2713'}
                      </span>
                    ) : (
                      <span
                        className="text-red-600 cursor-help"
                        title={qv?.errors.map((e) => e.message).join('\n')}
                      >
                        {'\u2717'}
                      </span>
                    )}
                  </td>
                )}
                <td className="border border-gray-200 px-2 py-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteQuestion(i)
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Vraag verwijderen"
                    aria-label={`Verwijder vraag ${i + 1}`}
                  >
                    {'\u2715'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {editingIndex !== null && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-3">
            Vraag {editingIndex + 1} bewerken
          </h3>

          {/* Category input in edit panel */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onderwerpcategorie
            </label>
            <input
              type="text"
              value={questions[editingIndex].category ?? ''}
              onChange={(e) => handleCategoryChange(editingIndex, e.target.value)}
              className="w-full px-2 py-1 border rounded"
              placeholder="Bijv. Celbiologie, Statistiek, Recht..."
            />
          </div>

          <div className="space-y-2">
            {questions[editingIndex].options.map((opt, j) => (
              <div key={j} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${editingIndex}`}
                  checked={opt.is_correct}
                  onChange={() => handleCorrectChange(editingIndex, j)}
                />
                <span className="font-mono text-sm">
                  {String.fromCharCode(65 + j)}.
                </span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) =>
                    handleOptionChange(editingIndex, j, e.target.value)
                  }
                  className="flex-1 px-2 py-1 border rounded"
                />
              </div>
            ))}
          </div>

          {/* Per-question validation errors in edit panel */}
          {validationResult && !validationDirty && (() => {
            const qv = getQuestionValidation(editingIndex)
            if (!qv || qv.is_valid) return null
            return (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <p className="font-medium mb-1">Validatiefouten:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {qv.errors.map((e, idx) => (
                    <li key={idx}>{e.message}</li>
                  ))}
                </ul>
                {qv.warnings.length > 0 && (
                  <>
                    <p className="font-medium mt-2 mb-1 text-yellow-700">
                      Waarschuwingen:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-yellow-700">
                      {qv.warnings.map((w, idx) => (
                        <li key={idx}>{w.message}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Error detail panel — all invalid questions */}
      {validationResult &&
        !validationDirty &&
        !validationResult.is_valid && (
          <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-red-800">
                Validatiefouten overzicht
              </h3>
              {!repairPlan && (
                <button
                  onClick={handleRepair}
                  disabled={repairing}
                  className="bg-amber-500 text-white text-sm py-1.5 px-4 rounded-md hover:bg-amber-600 disabled:opacity-50"
                >
                  {repairing ? 'AI analyseert...' : 'AI Reparatie'}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {validationResult.results
                .filter((r) => !r.is_valid)
                .map((r) => (
                  <div key={r.question_index} className="text-sm">
                    <p className="font-medium text-red-700">
                      Vraag {r.question_index + 1} (ID: {r.question_id})
                    </p>
                    <ul className="list-disc list-inside text-red-600 ml-2">
                      {r.errors.map((e, idx) => (
                        <li key={idx}>{e.message}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Repair plan panel */}
      {repairPlan && repairPlan.proposals.length > 0 && (
        <div className="mb-6 p-4 border border-amber-200 rounded-lg bg-amber-50">
          <h3 className="font-medium text-amber-800 mb-2">
            AI Reparatieplan
          </h3>
          <p className="text-sm text-amber-700 mb-4">{repairPlan.summary}</p>

          <div className="space-y-3 mb-4">
            {repairPlan.proposals.map((proposal, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white rounded border border-amber-100"
              >
                <input
                  type="checkbox"
                  checked={repairSelections[idx] ?? true}
                  onChange={(e) =>
                    setRepairSelections((prev) => ({
                      ...prev,
                      [idx]: e.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-800">
                    Vraag {proposal.question_index + 1} — {proposal.field}
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Huidig: </span>
                    {proposal.current_value || (
                      <span className="italic text-gray-400">leeg</span>
                    )}
                    <span className="mx-2 text-gray-400">{'\u2192'}</span>
                    <span className="font-medium text-amber-700">
                      {proposal.proposed_value}
                    </span>
                  </p>
                  <p className="text-gray-500 mt-1">{proposal.explanation}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyRepairs}
              className="bg-amber-600 text-white text-sm py-1.5 px-4 rounded-md hover:bg-amber-700"
            >
              Toepassen
            </button>
            <button
              onClick={handleCancelRepair}
              className="border border-gray-300 text-gray-700 text-sm py-1.5 px-4 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleAddQuestion}
          className="border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50"
        >
          + Vraag toevoegen
        </button>
        <button
          onClick={() => handleValidate()}
          disabled={validating || questions.length === 0}
          className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {validating ? 'Bezig met valideren...' : 'Valideren'}
        </button>
        <button
          onClick={() => handleSaveAndAnalyze()}
          disabled={saving || !canSave}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
          title={
            !canSave ? 'Valideer eerst alle vragen' : 'Opslaan en analyseren'
          }
        >
          {saving ? 'Bezig met opslaan...' : 'Opslaan & Analyseren'}
        </button>
      </div>
    </div>
  )
}
