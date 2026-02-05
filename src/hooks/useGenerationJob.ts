import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { GenerationJob } from '../lib/types'

export function useGenerationJob(jobId: string | undefined) {
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      setLoading(false)
      return
    }

    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const fetchJob = async () => {
      const { data, error: fetchError } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      setJob(data as GenerationJob)
      setLoading(false)

      // Stop polling if job is completed or failed
      if (data && (data.status === 'completed' || data.status === 'failed')) {
        if (interval) clearInterval(interval)
      }
    }

    fetchJob()

    // Poll every 3 seconds
    interval = setInterval(fetchJob, 3000)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [jobId])

  return { job, loading, error }
}
