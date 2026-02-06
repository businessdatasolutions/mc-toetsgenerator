import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockFrom, mockGetSession, mockUpdate } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
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
  vi.useFakeTimers({ shouldAdvanceTime: true })

  mockUpdate.mockReturnValue({
    eq: () => Promise.resolve({ error: null }),
  })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'questions') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: mockQuestion, error: null }),
          }),
        }),
        update: mockUpdate,
      }
    }
    if (table === 'assessments') {
      return {
        select: () => ({
          eq: vi.fn().mockReturnValue({
            order: () => ({
              limit: () =>
                Promise.resolve({ data: [mockAssessment], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              order: () => ({
                limit: () =>
                  Promise.resolve({ data: [mockAssessment], error: null }),
              }),
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

  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  })
})

afterEach(() => {
  vi.useRealTimers()
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

  it('T9.1: "Herbeoordelen" button is visible when assessment is present', async () => {
    renderDetail()
    await screen.findByText('Wat is de hoofdstad van Nederland?')

    expect(screen.getByText('Herbeoordelen')).toBeInTheDocument()
  })

  it('T9.2: clicking "Herbeoordelen" calls analyze endpoint with question_id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'processing' }), { status: 200 })
    )

    renderDetail()
    await screen.findByText('Wat is de hoofdstad van Nederland?')

    fireEvent.click(screen.getByText('Herbeoordelen'))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/analyze'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            exam_id: 'exam1',
            question_id: 'q1',
          }),
        })
      )
    })

    fetchSpy.mockRestore()
  })

  it('T9.3: loading state during reassessment (button disabled + text changes)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'processing' }), { status: 200 })
    )

    renderDetail()
    await screen.findByText('Wat is de hoofdstad van Nederland?')

    fireEvent.click(screen.getByText('Herbeoordelen'))

    await waitFor(() => {
      expect(screen.getByText('Bezig...')).toBeInTheDocument()
    })

    const btn = screen.getByText('Bezig...')
    expect(btn).toBeDisabled()

    vi.spyOn(globalThis, 'fetch').mockRestore()
  })

  it('T9.4: error message on failed reassessment', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Server fout' }), { status: 500 })
    )

    renderDetail()
    await screen.findByText('Wat is de hoofdstad van Nederland?')

    fireEvent.click(screen.getByText('Herbeoordelen'))

    await waitFor(() => {
      expect(screen.getByText('Server fout')).toBeInTheDocument()
    })

    vi.spyOn(globalThis, 'fetch').mockRestore()
  })

  it('T9.5: "Scores mogelijk verouderd" label when question.version > assessment.question_version', async () => {
    // Return question with version 2 but assessment with question_version 1
    const staleQuestion = { ...mockQuestion, version: 2 }
    mockFrom.mockImplementation((table: string) => {
      if (table === 'questions') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: staleQuestion, error: null }),
            }),
          }),
          update: mockUpdate,
        }
      }
      if (table === 'assessments') {
        return {
          select: () => ({
            eq: vi.fn().mockReturnValue({
              order: () => ({
                limit: () =>
                  Promise.resolve({ data: [mockAssessment], error: null }),
              }),
              eq: vi.fn().mockReturnValue({
                order: () => ({
                  limit: () =>
                    Promise.resolve({ data: [mockAssessment], error: null }),
                }),
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

    renderDetail()
    await screen.findByText('Wat is de hoofdstad van Nederland?')

    expect(screen.getByText(/Scores mogelijk verouderd/)).toBeInTheDocument()
  })
})
