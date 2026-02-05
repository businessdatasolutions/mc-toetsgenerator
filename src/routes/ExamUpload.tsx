import { useState } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '../components/FileUploader'
import { supabase } from '../lib/supabase'

export default function ExamUpload() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [learningObjectives, setLearningObjectives] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    setLoading(true)
    setError(null)

    try {
      // 8.2c: Create exam record
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title,
          subject: subject || null,
          learning_objectives: learningObjectives
            ? learningObjectives.split(',').map((s) => s.trim())
            : [],
        })
        .select('id')
        .single()

      if (examError) throw examError

      // Upload file to storage
      const filePath = `${exam.id}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      navigate(`/exams/${exam.id}/parse`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Toets uploaden</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Toets titel *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Vaknaam
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="learning-objectives"
            className="block text-sm font-medium text-gray-700"
          >
            Leerdoelen (kommagescheiden)
          </label>
          <input
            id="learning-objectives"
            type="text"
            value={learningObjectives}
            onChange={(e) => setLearningObjectives(e.target.value)}
            placeholder="Leerdoel 1, Leerdoel 2, ..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bestand *
          </label>
          <FileUploader onFileSelected={setFile} />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !file || !title}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Bezig met uploaden...' : 'Uploaden'}
        </button>
      </form>
    </div>
  )
}
