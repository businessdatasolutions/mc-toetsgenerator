import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Assessment, Question } from '../lib/types'

export interface QuestionWithAssessment extends Question {
  assessments: Assessment[]
}

export function useQuestions(examId: string | undefined) {
  const [questions, setQuestions] = useState<QuestionWithAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) return

    async function fetchQuestions() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*, assessments(*)')
        .eq('exam_id', examId!)
        .order('position')

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setQuestions((data ?? []) as QuestionWithAssessment[])
      }
      setLoading(false)
    }

    fetchQuestions()
  }, [examId])

  const refetch = async () => {
    if (!examId) return
    const { data } = await supabase
      .from('questions')
      .select('*, assessments(*)')
      .eq('exam_id', examId)
      .order('position')

    if (data) {
      setQuestions(data as QuestionWithAssessment[])
    }
  }

  return { questions, setQuestions, loading, error, refetch }
}
