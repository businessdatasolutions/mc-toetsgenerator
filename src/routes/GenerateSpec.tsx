import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import type { BloomLevel, Material } from '../lib/types'

export default function GenerateSpec() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedMaterialId = (location.state as { materialId?: string })?.materialId ?? ''

  const [materials, setMaterials] = useState<Material[]>([])
  const [materialId, setMaterialId] = useState(preselectedMaterialId)
  const [count, setCount] = useState(5)
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('begrijpen')
  const [learningGoal, setLearningGoal] = useState('')
  const [numOptions, setNumOptions] = useState(4)
  const [examId, setExamId] = useState('')
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 14.2a: Load materials
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .gt('chunk_count', 0)
        .order('created_at', { ascending: false })

      if (data) setMaterials(data as Material[])
    }
    load()
  }, [])

  // 14.2c: Load exams for optional linking
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('exams')
        .select('id, title')
        .order('created_at', { ascending: false })

      if (data) setExams(data)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || !learningGoal.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Niet ingelogd')

      // 14.2d: POST to Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            material_id: materialId,
            exam_id: examId || null,
            specification: {
              count,
              bloom_level: bloomLevel,
              learning_goal: learningGoal,
              num_options: numOptions,
            },
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Generatie mislukt' }))
        throw new Error(err.error || 'Generatie mislukt')
      }

      const result = await response.json()
      navigate(`/generate/${result.job_id}/review`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vragen genereren</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 14.2a: Material selection */}
        <div>
          <label htmlFor="material" className="block text-sm font-medium text-gray-700">
            Studiemateriaal *
          </label>
          <select
            id="material"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="">Selecteer materiaal...</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.filename} ({m.chunk_count} chunks)
              </option>
            ))}
          </select>
          {materials.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Nog geen verwerkt materiaal.{' '}
              <a href="/mc-toetsgenerator/materials/upload" className="text-blue-600 hover:underline">
                Upload materiaal
              </a>
            </p>
          )}
        </div>

        {/* 14.2b: Count */}
        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700">
            Aantal vragen (1-20) *
          </label>
          <input
            id="count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        {/* 14.2b: Bloom level */}
        <div>
          <label htmlFor="bloom" className="block text-sm font-medium text-gray-700">
            Bloom-niveau *
          </label>
          <select
            id="bloom"
            value={bloomLevel}
            onChange={(e) => setBloomLevel(e.target.value as BloomLevel)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="onthouden">Onthouden</option>
            <option value="begrijpen">Begrijpen</option>
            <option value="toepassen">Toepassen</option>
            <option value="analyseren">Analyseren</option>
          </select>
        </div>

        {/* 14.2b: Learning goal */}
        <div>
          <label htmlFor="learning-goal" className="block text-sm font-medium text-gray-700">
            Leerdoel *
          </label>
          <textarea
            id="learning-goal"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            required
            rows={3}
            placeholder="Bijv.: De student kan de principes van constructive alignment uitleggen en toepassen."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        {/* 14.2b: Number of options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aantal antwoordopties *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="num-options"
                value={3}
                checked={numOptions === 3}
                onChange={() => setNumOptions(3)}
                className="text-blue-600"
              />
              <span>3 opties</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="num-options"
                value={4}
                checked={numOptions === 4}
                onChange={() => setNumOptions(4)}
                className="text-blue-600"
              />
              <span>4 opties</span>
            </label>
          </div>
        </div>

        {/* 14.2c: Optional exam linking */}
        <div>
          <label htmlFor="exam" className="block text-sm font-medium text-gray-700">
            Koppel aan toets (optioneel)
          </label>
          <select
            id="exam"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          >
            <option value="">Geen koppeling</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading || !materialId || !learningGoal.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Bezig met genereren...' : 'Genereer vragen'}
        </button>
      </form>
    </div>
  )
}
