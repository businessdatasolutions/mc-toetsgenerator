import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'

interface Exam {
  id: string
  title: string
  course: string | null
  analysis_status: string
  created_at: string
}

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExams() {
      const { data } = await supabase
        .from('exams')
        .select('id, title, course, analysis_status, created_at')
        .order('created_at', { ascending: false })
      setExams(data ?? [])
      setLoading(false)
    }
    fetchExams()
  }, [])

  if (loading) return <p className="text-gray-500">Laden...</p>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mijn toetsen</h1>
        <Link
          to="/exams/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          Nieuwe toets uploaden
        </Link>
      </div>

      {exams.length === 0 ? (
        <p className="text-gray-500">
          Nog geen toetsen. <Link to="/exams/upload" className="text-blue-600 underline">Upload je eerste toets</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/exams/${exam.id}`}
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  {exam.course && (
                    <p className="text-sm text-gray-500">{exam.course}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    exam.analysis_status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : exam.analysis_status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {exam.analysis_status === 'completed' ? 'Geanalyseerd' :
                     exam.analysis_status === 'processing' ? 'Bezig...' : 'Wacht op analyse'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(exam.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
