import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import type { Exam } from '../lib/types'

const MAX_REALTIME_ERRORS = 3
const POLL_INTERVAL_MS = 3_000

export function useExam() {
  const { examId } = useParams<{ examId: string }>()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const realtimeErrorCount = useRef(0)
  const usingPolling = useRef(false)

  useEffect(() => {
    if (!examId) return

    let pollTimer: ReturnType<typeof setInterval> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

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

    function startPolling() {
      if (pollTimer) return
      usingPolling.current = true

      pollTimer = setInterval(async () => {
        const { data } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId!)
          .single()

        if (data) {
          setExam((prev) => {
            if (!prev) return data as Exam
            if (
              prev.analysis_status !== data.analysis_status ||
              prev.questions_analyzed !== data.questions_analyzed
            ) {
              return { ...prev, ...data } as Exam
            }
            return prev
          })
        }
      }, POLL_INTERVAL_MS)
    }

    fetchExam()

    // Realtime subscription with automatic polling fallback
    channel = supabase
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
            prev ? ({ ...prev, ...payload.new } as Exam) : null
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeErrorCount.current = 0
          return
        }

        if (
          status === 'TIMED_OUT' ||
          status === 'CHANNEL_ERROR' ||
          status === 'CLOSED'
        ) {
          realtimeErrorCount.current += 1

          if (
            realtimeErrorCount.current >= MAX_REALTIME_ERRORS &&
            !usingPolling.current
          ) {
            if (channel) {
              supabase.removeChannel(channel)
              channel = null
            }
            startPolling()
          }
        }
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [examId])

  return { exam, loading, error, examId }
}
