import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { exportExam } from '../lib/api'

type ExportFormat = 'csv' | 'pdf' | 'markdown'

export default function Export() {
  const { examId } = useParams<{ examId: string }>()
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (!examId) return
    setLoading(format)
    setError(null)

    try {
      await exportExam(examId, format)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export mislukt')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/exams/${examId}`}
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Terug naar dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">Exporteren</h1>

      <p className="text-gray-600 mb-6">
        Exporteer de toetsresultaten in het gewenste formaat.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleExport('csv')}
          disabled={loading !== null}
          className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-center"
        >
          <div className="text-2xl mb-2">CSV</div>
          <p className="text-sm text-gray-500">
            {loading === 'csv' ? 'Bezig...' : 'Spreadsheet formaat'}
          </p>
        </button>

        <button
          onClick={() => handleExport('markdown')}
          disabled={loading !== null}
          className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-center"
        >
          <div className="text-2xl mb-2">Markdown</div>
          <p className="text-sm text-gray-500">
            {loading === 'markdown' ? 'Bezig...' : 'Gestructureerd rapport'}
          </p>
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={loading !== null}
          className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-center"
        >
          <div className="text-2xl mb-2">PDF</div>
          <p className="text-sm text-gray-500">
            {loading === 'pdf' ? 'Bezig...' : 'Niet beschikbaar'}
          </p>
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  )
}
