import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'

interface ParsedOption {
  text: string
  position: number
  is_correct: boolean
}

interface ParsedQuestion {
  stem: string
  options: ParsedOption[]
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
        setQuestions(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      } finally {
        setLoading(false)
      }
    }

    loadAndParse()
  }, [examId])

  const handleStemChange = (index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, stem: value } : q))
    )
  }

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
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
    setQuestions((prev) =>
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

  const handleSaveAndAnalyze = async () => {
    if (!examId) return
    setSaving(true)
    setError(null)

    try {
      // 8.8d: Write questions to Supabase
      const questionRows = questions.map((q, i) => ({
        exam_id: examId,
        stem: q.stem,
        options: q.options,
        correct_option: q.options.findIndex((o) => o.is_correct),
        position: i,
        version: 1,
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

      navigate(`/exams/${examId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Bestand wordt verwerkt...</p>
  }

  if (error && questions.length === 0) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vragen verwerken</h1>

      <p className="text-gray-600 mb-4">
        {questions.length} vragen gevonden. Klik op een rij om te bewerken.
      </p>

      <table className="w-full border-collapse border border-gray-200 mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left w-12">#</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Stam</th>
            <th className="border border-gray-200 px-4 py-2 text-center w-24">Opties</th>
            <th className="border border-gray-200 px-4 py-2 text-left w-48">Correct</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => (
            <tr
              key={i}
              className="hover:bg-gray-50 cursor-pointer"
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
              <td className="border border-gray-200 px-4 py-2 text-center">
                {q.options.length}
              </td>
              <td className="border border-gray-200 px-4 py-2">
                {q.options.find((o) => o.is_correct)?.text.slice(0, 30) ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingIndex !== null && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-3">
            Vraag {editingIndex + 1} bewerken
          </h3>
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
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleSaveAndAnalyze}
        disabled={saving || questions.length === 0}
        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Bezig met opslaan...' : 'Opslaan & Analyseren'}
      </button>
    </div>
  )
}
