import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import { supabase } from '../lib/supabase'
import type { Question, Assessment } from '../lib/types'
import RadarChart from '../components/RadarChart'
import ScoreBadge from '../components/ScoreBadge'
import BloomBadge from '../components/BloomBadge'

const POLL_INTERVAL = 2000
const POLL_TIMEOUT = 60000

export default function QuestionDetail() {
  const { examId, questionId } = useParams<{
    examId: string
    questionId: string
  }>()
  const [question, setQuestion] = useState<Question | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editStem, setEditStem] = useState('')
  const [editOptions, setEditOptions] = useState<
    { text: string; position: number; is_correct?: boolean }[]
  >([])
  const [expandedDimension, setExpandedDimension] = useState<string | null>(
    null
  )
  const [reassessing, setReassessing] = useState(false)
  const [reassessError, setReassessError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!questionId) return

    async function fetchData() {
      setLoading(true)
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId!)
        .single()

      if (qData) {
        setQuestion(qData as Question)
        setEditStem(qData.stem)
        setEditOptions(qData.options as typeof editOptions)
      }

      const { data: aData } = await supabase
        .from('assessments')
        .select('*')
        .eq('question_id', questionId!)
        .order('created_at', { ascending: false })
        .limit(1)

      if (aData && aData.length > 0) {
        setAssessment(aData[0] as Assessment)
      }

      setLoading(false)
    }

    fetchData()
  }, [questionId])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSave = async () => {
    if (!questionId || !question) return
    const newVersion = (question.version ?? 1) + 1
    await supabase
      .from('questions')
      .update({ stem: editStem, options: editOptions, version: newVersion })
      .eq('id', questionId)

    setQuestion((prev) =>
      prev
        ? { ...prev, stem: editStem, options: editOptions, version: newVersion }
        : null
    )
    setEditing(false)
  }

  const handleReassess = async () => {
    if (!examId || !questionId) return
    setReassessing(true)
    setReassessError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setReassessError('Niet ingelogd. Log opnieuw in.')
        setReassessing(false)
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
          body: JSON.stringify({
            exam_id: examId,
            question_id: questionId,
          }),
        }
      )

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        setReassessError(
          errBody.error ?? 'Herbeoordeling mislukt. Probeer het opnieuw.'
        )
        setReassessing(false)
        return
      }

      // Poll for the new assessment
      const startTime = Date.now()
      const currentVersion = question?.version ?? 1

      pollRef.current = setInterval(async () => {
        const { data: aData } = await supabase
          .from('assessments')
          .select('*')
          .eq('question_id', questionId!)
          .eq('question_version', currentVersion)
          .order('created_at', { ascending: false })
          .limit(1)

        if (aData && aData.length > 0) {
          const newAssessment = aData[0] as Assessment
          // Check if this is a newer assessment than what we had
          if (
            !assessment ||
            newAssessment.created_at > assessment.created_at
          ) {
            setAssessment(newAssessment)
            setReassessing(false)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        }

        if (Date.now() - startTime > POLL_TIMEOUT) {
          setReassessError(
            'Herbeoordeling duurt te lang. Ververs de pagina later.'
          )
          setReassessing(false)
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, POLL_INTERVAL)
    } catch {
      setReassessError('Herbeoordeling mislukt. Probeer het opnieuw.')
      setReassessing(false)
    }
  }

  const toggleDimension = (dim: string) => {
    setExpandedDimension((prev) => (prev === dim ? null : dim))
  }

  if (loading) return <p className="text-gray-500">Laden...</p>
  if (!question) return <p className="text-red-600">Vraag niet gevonden</p>

  const betScore = assessment?.bet_score ?? null
  const techScore = assessment?.tech_kwal_score ?? null
  const valScore = assessment?.val_score ?? null

  const isStale =
    assessment &&
    question.version != null &&
    assessment.question_version != null &&
    question.version > assessment.question_version

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to={`/exams/${examId}`}
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Terug naar dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Vraag {question.position + 1}
        </h1>
        <div className="flex gap-2">
          {assessment && (
            <button
              onClick={handleReassess}
              disabled={reassessing}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {reassessing ? 'Bezig...' : 'Herbeoordelen'}
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          >
            {editing ? 'Annuleren' : 'Bewerk'}
          </button>
        </div>
      </div>

      {reassessError && (
        <p className="text-red-600 text-sm mb-4">{reassessError}</p>
      )}

      {/* Question content */}
      <div className="mb-6 p-4 border rounded-lg">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editStem}
              onChange={(e) => setEditStem(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
            {editOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-sm w-6">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) =>
                    setEditOptions((prev) =>
                      prev.map((o, j) =>
                        j === i ? { ...o, text: e.target.value } : o
                      )
                    )
                  }
                  className="flex-1 border rounded px-2 py-1"
                />
                {opt.is_correct && (
                  <span className="text-green-600 text-sm font-medium">
                    Correct
                  </span>
                )}
              </div>
            ))}
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Opslaan
            </button>
          </div>
        ) : (
          <div>
            <p className="font-medium mb-3">{question.stem}</p>
            <div className="space-y-1">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    opt.is_correct ? 'bg-green-50 font-medium' : ''
                  }`}
                >
                  <span className="font-mono text-sm">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{opt.text}</span>
                  {opt.is_correct && (
                    <span className="text-green-600 text-xs ml-auto">
                      Correct
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stale scores warning */}
      {isStale && (
        <p className="text-amber-600 text-sm mb-4 p-2 bg-amber-50 rounded">
          Scores mogelijk verouderd — de vraag is bewerkt sinds de laatste beoordeling.
        </p>
      )}

      {/* Assessment */}
      {assessment ? (
        <>
          {/* Radar Chart */}
          <div className="mb-6 flex justify-center">
            <RadarChart
              bet={betScore ?? 0}
              tech={techScore ?? 0}
              val={valScore ?? 0}
            />
          </div>

          {/* Score summary */}
          <div className="flex justify-center gap-4 mb-6">
            <ScoreBadge score={betScore} label="Betrouwbaarheid" />
            <ScoreBadge score={techScore} label="Technisch" />
            <ScoreBadge score={valScore} label="Validiteit" />
            <BloomBadge level={assessment.val_cognitief_niveau} />
          </div>

          {/* Dimension details */}
          <div className="space-y-2 mb-6">
            {/* Betrouwbaarheid */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleDimension('bet')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Betrouwbaarheid</span>
                  <ScoreBadge score={betScore} />
                </div>
                <span>{expandedDimension === 'bet' ? '▼' : '▶'}</span>
              </button>
              {expandedDimension === 'bet' && (
                <div className="p-3 border-t text-sm space-y-2">
                  <p>
                    <span className="text-gray-500">Discriminatie:</span>{' '}
                    {assessment.bet_discriminatie ?? '-'}
                  </p>
                  <p>
                    <span className="text-gray-500">Ambiguiteit:</span>{' '}
                    {assessment.bet_ambiguiteit ?? '-'}
                  </p>
                  {assessment.bet_toelichting && (
                    <p className="text-gray-700">{assessment.bet_toelichting}</p>
                  )}
                </div>
              )}
            </div>

            {/* Technisch */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleDimension('tech')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Technisch</span>
                  <ScoreBadge score={techScore} />
                </div>
                <span>{expandedDimension === 'tech' ? '▼' : '▶'}</span>
              </button>
              {expandedDimension === 'tech' && (
                <div className="p-3 border-t text-sm space-y-2">
                  <p>
                    <span className="text-gray-500">Stam score:</span>{' '}
                    {assessment.tech_kwal_stam_score ?? '-'}
                  </p>
                  <p>
                    <span className="text-gray-500">Afleiders score:</span>{' '}
                    {assessment.tech_kwal_afleiders_score ?? '-'}
                  </p>
                  {assessment.tech_kwant_flags.length > 0 && (
                    <div>
                      <span className="text-gray-500">
                        Deterministische flags:
                      </span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {assessment.tech_kwant_flags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assessment.tech_problemen.length > 0 && (
                    <div>
                      <span className="text-gray-500">Problemen:</span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {assessment.tech_problemen.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assessment.tech_toelichting && (
                    <p className="text-gray-700">
                      {assessment.tech_toelichting}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Validiteit */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleDimension('val')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Validiteit</span>
                  <ScoreBadge score={valScore} />
                </div>
                <span>{expandedDimension === 'val' ? '▼' : '▶'}</span>
              </button>
              {expandedDimension === 'val' && (
                <div className="p-3 border-t text-sm space-y-2">
                  <p>
                    <span className="text-gray-500">Cognitief niveau:</span>{' '}
                    <BloomBadge level={assessment.val_cognitief_niveau} />
                  </p>
                  {assessment.val_toelichting && (
                    <p className="text-gray-700">
                      {assessment.val_toelichting}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Improvement suggestions */}
          {assessment.improvement_suggestions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">
                Verbetervoorstellen
              </h2>
              <div className="space-y-2">
                {assessment.improvement_suggestions.map((s, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-yellow-50">
                    <span className="text-xs font-medium text-yellow-700 uppercase">
                      {s.dimensie}
                    </span>
                    <p className="text-sm mt-1">{s.suggestie}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">Geen beoordeling beschikbaar.</p>
      )}
    </div>
  )
}
