import { supabase } from './supabase'

export async function exportExam(
  examId: string,
  format: 'csv' | 'pdf' | 'markdown'
): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token

  if (!token) {
    throw new Error('Niet ingelogd')
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export?exam_id=${examId}&format=${format}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Export mislukt' }))
    throw new Error(err.error || 'Export mislukt')
  }

  // Trigger browser download
  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition')
  const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/)
  const filename = filenameMatch?.[1] ?? `export.${format === 'markdown' ? 'md' : format}`

  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}
