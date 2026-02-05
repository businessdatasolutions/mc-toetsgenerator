import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'

const ACCEPTED_TYPES = '.pdf,.docx,.txt'

export default function MaterialUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    }
    return mimeMap[ext] ?? 'application/octet-stream'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const mimeType = getMimeType(file.name)

      // 14.1b: Upload to Supabase Storage
      const storagePath = `materials/${crypto.randomUUID()}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      // 14.1c: Create materials record
      const { data: material, error: matError } = await supabase
        .from('materials')
        .insert({
          filename: file.name,
          mime_type: mimeType,
          storage_path: storagePath,
          chunk_count: 0,
        })
        .select('id')
        .single()

      if (matError) throw matError

      setMaterialId(material.id)
      setProcessing(true)

      // 14.1d: Trigger embedding via Edge Function
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Niet ingelogd')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-material`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ material_id: material.id }),
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Embedding mislukt' }))
        throw new Error(err.error || 'Embedding mislukt')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setProcessing(false)
    } finally {
      setLoading(false)
    }
  }

  // 14.1e: Poll for chunk_count > 0
  useEffect(() => {
    if (!processing || !materialId) return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('materials')
        .select('chunk_count')
        .eq('id', materialId)
        .single()

      if (data && data.chunk_count > 0) {
        clearInterval(interval)
        // 14.1f: Navigate to generate page
        navigate('/generate', { state: { materialId } })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [processing, materialId, navigate])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Studiemateriaal uploaden</h1>

      {processing ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Materiaal wordt verwerkt...</p>
          <p className="text-sm text-gray-400 mt-2">
            Het bestand wordt geanalyseerd en opgesplitst in chunks voor retrieval.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bestand (PDF, DOCX of TXT) *
            </label>
            <div
              data-testid="material-uploader"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setFile(f)
                }}
                className="hidden"
                id="material-upload"
                data-testid="material-file-input"
              />
              <label htmlFor="material-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Sleep een bestand hierheen of klik om te selecteren
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Ondersteunde formaten: PDF, DOCX, TXT
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig met uploaden...' : 'Uploaden & verwerken'}
          </button>
        </form>
      )}
    </div>
  )
}
