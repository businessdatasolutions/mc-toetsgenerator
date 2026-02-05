import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

import QuestionDetail from './QuestionDetail'

const mockQuestion = {
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
}

const mockAssessment = {
  id: 'a1',
  question_id: 'q1',
  question_version: 1,
  tech_kwant_longest_bias: false,
  tech_kwant_homogeneity_score: 0.9,
  tech_kwant_absolute_terms_correct: [],
  tech_kwant_absolute_terms_distractors: [],
  tech_kwant_negation_detected: false,
  tech_kwant_negation_emphasized: false,
  tech_kwant_flags: ['langste-antwoord-bias'],
  bet_discriminatie: 'hoog',
  bet_ambiguiteit: 'geen',
  bet_score: 4,
  bet_toelichting: 'Goede discriminatie',
  tech_kwal_stam_score: 5,
  tech_kwal_afleiders_score: 4,
  tech_kwal_score: 4,
  tech_problemen: [],
  tech_toelichting: 'Technisch goed',
  val_cognitief_niveau: 'begrijpen',
  val_score: 3,
  val_toelichting: 'Redelijke validiteit',
  improvement_suggestions: [
    { dimensie: 'betrouwbaarheid', suggestie: 'Verbeter de afleiders' },
    { dimensie: 'validiteit', suggestie: 'Verhoog cognitief niveau' },
  ],
  created_at: '2024-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()

  mockFrom.mockImplementation((table: string) => {
    if (table === 'questions') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: mockQuestion, error: null }),
          }),
        }),
      }
    }
    if (table === 'assessments') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({ data: [mockAssessment], error: null }),
            }),
          }),
        }),
      }
    }
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }
  })
})

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/exams/exam1/questions/q1']}>
      <Routes>
        <Route
          path="/exams/:examId/questions/:questionId"
          element={<QuestionDetail />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('QuestionDetail', () => {
  it('T9.6: renders stem, options, radar chart, scores, and improvement suggestions', async () => {
    renderDetail()

    expect(
      await screen.findByText('Wat is de hoofdstad van Nederland?')
    ).toBeInTheDocument()

    // Options
    expect(screen.getByText('Amsterdam')).toBeInTheDocument()
    expect(screen.getByText('Rotterdam')).toBeInTheDocument()
    expect(screen.getByText('Den Haag')).toBeInTheDocument()
    expect(screen.getByText('Utrecht')).toBeInTheDocument()

    // Correct marker
    const correctMarkers = screen.getAllByText('Correct')
    expect(correctMarkers.length).toBeGreaterThanOrEqual(1)

    // Radar chart (SVG with role="img")
    const svg = document.querySelector('svg[role="img"]')
    expect(svg).toBeInTheDocument()

    // Score badges
    expect(screen.getByText('Betrouwbaarheid: 4')).toBeInTheDocument()
    expect(screen.getByText('Technisch: 4')).toBeInTheDocument()
    expect(screen.getByText('Validiteit: 3')).toBeInTheDocument()

    // Bloom badge
    expect(screen.getByText('Begrijpen')).toBeInTheDocument()

    // Dimension accordion headers
    expect(
      screen.getByRole('button', { name: /Betrouwbaarheid/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Technisch/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Validiteit/ })
    ).toBeInTheDocument()

    // Improvement suggestions
    expect(screen.getByText('Verbetervoorstellen')).toBeInTheDocument()
    expect(screen.getByText('Verbeter de afleiders')).toBeInTheDocument()
    expect(screen.getByText('Verhoog cognitief niveau')).toBeInTheDocument()
  })

  it('renders back link to dashboard', async () => {
    renderDetail()
    const backLink = await screen.findByText(/Terug naar dashboard/)
    expect(backLink).toBeInTheDocument()
    expect(backLink.closest('a')).toHaveAttribute('href', '/exams/exam1')
  })
})
