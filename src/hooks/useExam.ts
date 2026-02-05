import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import type { Exam } from '../lib/types'

export function useExam() {
  const { examId } = useParams<{ examId: string }>()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) return

    async function fetchExam() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId!)
        .single()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setExam(data as Exam)
      }
      setLoading(false)
    }

    fetchExam()

    // Realtime subscription on analysis_status changes
    const channel = supabase
      .channel(`exam-${examId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exams',
          filter: `id=eq.${examId}`,
        },
        (payload) => {
          setExam((prev) =>
            prev ? { ...prev, ...payload.new } as Exam : null
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [examId])

  return { exam, loading, error, examId }
}
