import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import QuestionCard from './QuestionCard'
import type { QuestionWithAssessment } from '../hooks/useQuestions'

const mockQuestion: QuestionWithAssessment = {
  id: 'q1',
  exam_id: 'exam1',
  position: 0,
  stem: 'Wat is de hoofdstad van Nederland?',
  options: [
    { text: 'Amsterdam', position: 0, is_correct: true },
    { text: 'Rotterdam', position: 1 },
    { text: 'Den Haag', position: 2 },
    { text: 'Utrecht', position: 3 },
  ],
  correct_option: 0,
  bloom_level: null,
  learning_goal: null,
  version: 1,
  source: 'imported',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  assessments: [
    {
      id: 'a1',
      question_id: 'q1',
      question_version: 1,
      tech_kwant_longest_bias: false,
      tech_kwant_homogeneity_score: 0.9,
      tech_kwant_absolute_terms_correct: [],
      tech_kwant_absolute_terms_distractors: [],
      tech_kwant_negation_detected: false,
      tech_kwant_negation_emphasized: false,
      tech_kwant_flags: [],
      bet_discriminatie: 'hoog',
      bet_ambiguiteit: 'geen',
      bet_score: 4,
      bet_toelichting: 'Goede vraag',
      tech_kwal_stam_score: 5,
      tech_kwal_afleiders_score: 4,
      tech_kwal_score: 4,
      tech_problemen: [],
      tech_toelichting: null,
      val_cognitief_niveau: 'onthouden',
      val_score: 3,
      val_toelichting: null,
      improvement_suggestions: [],
      created_at: '2024-01-01',
    },
  ],
}

describe('QuestionCard', () => {
  it('T9.3: renders stem, 3 scores, and Bloom badge', () => {
    render(
      <MemoryRouter>
        <QuestionCard question={mockQuestion} examId="exam1" />
      </MemoryRouter>
    )

    // Stem text (truncated to 80 chars)
    expect(
      screen.getByText('Wat is de hoofdstad van Nederland?')
    ).toBeInTheDocument()

    // Three score badges: B:4, T:4, V:3
    expect(screen.getByText('B: 4')).toBeInTheDocument()
    expect(screen.getByText('T: 4')).toBeInTheDocument()
    expect(screen.getByText('V: 3')).toBeInTheDocument()

    // Bloom badge
    expect(screen.getByText('Onthouden')).toBeInTheDocument()

    // Question number
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('renders dashes when no assessment', () => {
    const questionNoAssessment = { ...mockQuestion, assessments: [] }
    render(
      <MemoryRouter>
        <QuestionCard question={questionNoAssessment} examId="exam1" />
      </MemoryRouter>
    )

    // Three score badges with null show "B: -", "T: -", "V: -"
    expect(screen.getByText('B: -')).toBeInTheDocument()
    expect(screen.getByText('T: -')).toBeInTheDocument()
    expect(screen.getByText('V: -')).toBeInTheDocument()
    // Bloom badge shows "-"
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
