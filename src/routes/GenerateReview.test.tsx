import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockFrom, mockDelete } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

// Mock useGenerationJob hook
const { mockUseGenerationJob } = vi.hoisted(() => ({
  mockUseGenerationJob: vi.fn(),
}))

vi.mock('../hooks/useGenerationJob', () => ({
  useGenerationJob: mockUseGenerationJob,
}))

import GenerateReview from './GenerateReview'

const mockQuestions = [
  {
    id: 'q-1',
    exam_id: 'exam-1',
    position: 1,
    stem: 'Wat is constructive alignment?',
    options: [
      { text: 'Afstemming van leerdoelen, toetsing en onderwijs', position: 0, is_correct: true },
      { text: 'Een bouwkundige techniek', position: 1, is_correct: false },
      { text: 'Een lesmethode', position: 2, is_correct: false },
      { text: 'Een beoordelingscriterium', position: 3, is_correct: false },
    ],
    correct_option: 0,
    bloom_level: 'begrijpen',
    learning_goal: 'Test',
    version: 1,
    source: 'generated' as const,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assessments: [
      {
        id: 'a-1',
        question_id: 'q-1',
        question_version: 1,
        bet_score: 4,
        tech_kwal_score: 3,
        val_score: 5,
        val_cognitief_niveau: 'begrijpen',
        bet_discriminatie: null,
        bet_ambiguiteit: null,
        bet_toelichting: null,
        tech_kwal_stam_score: null,
        tech_kwal_afleiders_score: null,
        tech_problemen: [],
        tech_toelichting: null,
        val_toelichting: null,
        tech_kwant_longest_bias: null,
        tech_kwant_homogeneity_score: null,
        tech_kwant_absolute_terms_correct: [],
        tech_kwant_absolute_terms_distractors: [],
        tech_kwant_negation_detected: null,
        tech_kwant_negation_emphasized: null,
        tech_kwant_flags: [],
        improvement_suggestions: [],
        created_at: '2024-01-01',
      },
    ],
  },
  {
    id: 'q-2',
    exam_id: 'exam-1',
    position: 2,
    stem: 'Welk Bloom-niveau is het hoogst?',
    options: [
      { text: 'Onthouden', position: 0, is_correct: false },
      { text: 'Begrijpen', position: 1, is_correct: false },
      { text: 'Analyseren', position: 2, is_correct: true },
      { text: 'Toepassen', position: 3, is_correct: false },
    ],
    correct_option: 2,
    bloom_level: 'analyseren',
    learning_goal: 'Test',
    version: 1,
    source: 'generated' as const,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assessments: [
      {
        id: 'a-2',
        question_id: 'q-2',
        question_version: 1,
        bet_score: 3,
        tech_kwal_score: 4,
        val_score: 4,
        val_cognitief_niveau: 'analyseren',
        bet_discriminatie: null,
        bet_ambiguiteit: null,
        bet_toelichting: null,
        tech_kwal_stam_score: null,
        tech_kwal_afleiders_score: null,
        tech_problemen: [],
        tech_toelichting: null,
        val_toelichting: null,
        tech_kwant_longest_bias: null,
        tech_kwant_homogeneity_score: null,
        tech_kwant_absolute_terms_correct: [],
        tech_kwant_absolute_terms_distractors: [],
        tech_kwant_negation_detected: null,
        tech_kwant_negation_emphasized: null,
        tech_kwant_flags: [],
        improvement_suggestions: [],
        created_at: '2024-01-01',
      },
    ],
  },
]

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/generate/job-1/review']}>
      <Routes>
        <Route path="/generate/:jobId/review" element={<GenerateReview />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('GenerateReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'questions') {
        return {
          select: () => ({
            in: () => ({
              order: () => ({
                then: (cb: (result: { data: unknown[] }) => void) => {
                  cb({ data: mockQuestions })
                  return { catch: () => {} }
                },
              }),
            }),
          }),
          delete: () => ({
            eq: mockDelete,
          }),
        }
      }
      return { select: vi.fn() }
    })

    mockDelete.mockResolvedValue({ error: null })
  })

  it('T14.3: renders questions when job is completed', async () => {
    mockUseGenerationJob.mockReturnValue({
      job: {
        id: 'job-1',
        status: 'completed',
        result_question_ids: ['q-1', 'q-2'],
        exam_id: 'exam-1',
        error_message: null,
      },
      loading: false,
      error: null,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Gegenereerde vragen beoordelen')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
      expect(screen.getByText('Welk Bloom-niveau is het hoogst?')).toBeInTheDocument()
    })

    // Score badges should be visible
    expect(screen.getAllByText(/B:/).length).toBeGreaterThanOrEqual(2)

    // Action buttons should be visible
    expect(screen.getAllByText('Bewerken').length).toBe(2)
    expect(screen.getAllByText('Verwijderen').length).toBe(2)
  })

  it('T14.4: clicking delete removes question from list', async () => {
    mockUseGenerationJob.mockReturnValue({
      job: {
        id: 'job-1',
        status: 'completed',
        result_question_ids: ['q-1', 'q-2'],
        exam_id: 'exam-1',
        error_message: null,
      },
      loading: false,
      error: null,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Welk Bloom-niveau is het hoogst?')).toBeInTheDocument()
    })

    // Click delete on second question
    const deleteButtons = screen.getAllByText('Verwijderen')
    fireEvent.click(deleteButtons[1])

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('id', 'q-2')
    })
  })

  it('shows loading state while job is processing', () => {
    mockUseGenerationJob.mockReturnValue({
      job: {
        id: 'job-1',
        status: 'processing',
        result_question_ids: [],
        exam_id: null,
        error_message: null,
      },
      loading: false,
      error: null,
    })

    renderWithRouter()

    expect(screen.getByText('Vragen worden gegenereerd...')).toBeInTheDocument()
  })

  it('shows error state when job fails', () => {
    mockUseGenerationJob.mockReturnValue({
      job: {
        id: 'job-1',
        status: 'failed',
        result_question_ids: [],
        exam_id: null,
        error_message: 'Geen relevante chunks gevonden',
      },
      loading: false,
      error: null,
    })

    renderWithRouter()

    expect(screen.getByText('Generatie mislukt')).toBeInTheDocument()
    expect(screen.getByText('Geen relevante chunks gevonden')).toBeInTheDocument()
  })
})
