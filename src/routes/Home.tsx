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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  async function handleDeleteExam(examId: string) {
    setDeleteError(null)
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId)

    if (error) {
      setDeleteError('Verwijderen mislukt. Probeer het opnieuw.')
    } else {
      setExams((prev) => prev.filter((e) => e.id !== examId))
    }
    setDeletingId(null)
  }

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

      {deleteError && (
        <p className="text-red-600 mb-4">{deleteError}</p>
      )}

      {exams.length === 0 ? (
        <p className="text-gray-500">
          Nog geen toetsen. <Link to="/exams/upload" className="text-blue-600 underline">Upload je eerste toets</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => (
            <div key={exam.id} className="border rounded-lg transition-colors">
              {deletingId === exam.id ? (
                <div className="p-4 bg-red-50">
                  <p className="text-sm text-red-800 mb-3">
                    Weet je zeker dat je <strong>{exam.title}</strong> wilt verwijderen? Alle vragen en analyses worden definitief verwijderd.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Verwijderen
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-3 py-1 text-sm bg-white text-gray-700 border rounded hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link
                    to={`/exams/${exam.id}`}
                    className="flex-1 p-4 hover:bg-gray-50"
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
                  <button
                    onClick={() => setDeletingId(exam.id)}
                    className="p-4 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Toets verwijderen"
                    aria-label={`Verwijder ${exam.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
