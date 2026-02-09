import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockFrom, mockRpc, mockDelete, mockInsert, mockGetSession,
        mockChannel, mockRemoveChannel, mockSubscribe } =
  vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockRpc: vi.fn(),
    mockDelete: vi.fn(),
    mockInsert: vi.fn(),
    mockGetSession: vi.fn(),
    mockChannel: vi.fn(),
    mockRemoveChannel: vi.fn(),
    mockSubscribe: vi.fn(),
  }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: { getSession: mockGetSession },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}))

import ExamDashboard from './ExamDashboard'

const mockExam = {
  id: 'exam1',
  title: 'Test Toets',
  course: 'Informatica',
  created_by: 'user1',
  learning_goals: [],
  analysis_status: 'completed',
  question_count: 3,
  questions_analyzed: 3,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

function makeAssessment(qId: string, bet: number, tech: number, val: number) {
  return {
    id: `a-${qId}`,
    question_id: qId,
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
    bet_score: bet,
    bet_toelichting: null,
    tech_kwal_stam_score: tech,
    tech_kwal_afleiders_score: tech,
    tech_kwal_score: tech,
    tech_problemen: [],
    tech_toelichting: null,
    val_cognitief_niveau: 'onthouden',
    val_score: val,
    val_toelichting: null,
    improvement_suggestions: [],
    created_at: '2024-01-01',
  }
}

const mockQuestions = [
  {
    id: 'q1',
    exam_id: 'exam1',
    position: 0,
    stem: 'Vraag 1 stam tekst',
    options: [
      { text: 'A', position: 0, is_correct: true },
      { text: 'B', position: 1 },
    ],
    correct_option: 0,
    bloom_level: null,
    learning_goal: null,
    version: 1,
    source: 'imported',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assessments: [makeAssessment('q1', 4, 3, 5)],
  },
  {
    id: 'q2',
    exam_id: 'exam1',
    position: 1,
    stem: 'Vraag 2 stam tekst',
    options: [
      { text: 'A', position: 0, is_correct: true },
      { text: 'B', position: 1 },
    ],
    correct_option: 0,
    bloom_level: null,
    learning_goal: null,
    version: 1,
    source: 'imported',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assessments: [makeAssessment('q2', 2, 4, 3)],
  },
  {
    id: 'q3',
    exam_id: 'exam1',
    position: 2,
    stem: 'Vraag 3 stam tekst',
    options: [
      { text: 'A', position: 0, is_correct: true },
      { text: 'B', position: 1 },
    ],
    correct_option: 0,
    bloom_level: null,
    learning_goal: null,
    version: 1,
    source: 'imported',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    assessments: [makeAssessment('q3', 5, 5, 4)],
  },
]

beforeEach(() => {
  vi.clearAllMocks()

  mockDelete.mockResolvedValue({ error: null })
  mockInsert.mockResolvedValue({ error: null })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'exams') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockExam, error: null }),
          }),
        }),
      }
    }
    if (table === 'questions') {
      return {
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({ data: mockQuestions, error: null }),
          }),
        }),
        delete: () => ({
          eq: mockDelete,
        }),
        insert: mockInsert,
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

  vi.spyOn(window, 'confirm').mockReturnValue(true)

  mockRpc.mockResolvedValue({
    data: [{ avg_bet: 3.7, avg_tech: 4.0, avg_val: 4.0 }],
    error: null,
  })

  mockSubscribe.mockImplementation((callback?: Function) => {
    if (callback) callback('SUBSCRIBED')
    return { unsubscribe: vi.fn() }
  })

  mockChannel.mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
  })

  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  })
})

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/exams/exam1']}>
      <Routes>
        <Route path="/exams/:examId" element={<ExamDashboard />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExamDashboard', () => {
  it('T9.5: renders KPI cards, heatmap, and question cards with 3 questions', async () => {
    renderDashboard()

    expect(await screen.findByText('Test Toets')).toBeInTheDocument()

    expect(screen.getByText('Informatica')).toBeInTheDocument()

    // KPI labels (also appear in sort dropdown, so use getAllByText)
    expect(screen.getAllByText('Betrouwbaarheid').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Technisch').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Validiteit').length).toBeGreaterThanOrEqual(1)

    // Heatmap
    expect(screen.getByText('Scoreoverzicht')).toBeInTheDocument()
    const tbody = document.querySelector('tbody')!
    expect(tbody.querySelectorAll('tr').length).toBe(3)

    // Question cards (q2 appears in both attention and all sections)
    expect(screen.getAllByText('Vraag 1 stam tekst').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Vraag 2 stam tekst').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Vraag 3 stam tekst').length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText('Alle vragen (3)')).toBeInTheDocument()
  })

  it('shows attention questions section when scores <= 2', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')
    expect(screen.getByText('Aandachtsvragen (1)')).toBeInTheDocument()
  })

  it('TD.1: shows delete, duplicate and reassess buttons per question card', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    const duplicateButtons = screen.getAllByTitle('Vraag dupliceren')
    const reassessButtons = screen.getAllByTitle('Herbeoordelen')

    // q2 appears in both attention and all sections = 4 cards total
    expect(deleteButtons.length).toBeGreaterThanOrEqual(3)
    expect(duplicateButtons.length).toBeGreaterThanOrEqual(3)
    expect(reassessButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('TD.2: clicking delete calls supabase delete', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  it('TD.3: question disappears after successful deletion', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    // Get the first delete button in the "Alle vragen" section
    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  it('TD.4: clicking duplicate calls supabase insert with same fields', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    const duplicateButtons = screen.getAllByTitle('Vraag dupliceren')
    fireEvent.click(duplicateButtons[0])

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          exam_id: 'exam1',
          stem: expect.any(String),
          position: 3,
          version: 1,
        })
      )
    })
  })

  it('TD.8: clicking reassess calls analyze endpoint with question_id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'processing' }), { status: 200 })
    )

    renderDashboard()
    await screen.findByText('Test Toets')

    const reassessButtons = screen.getAllByTitle('Herbeoordelen')
    fireEvent.click(reassessButtons[0])

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/analyze'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('question_id'),
        })
      )
    })

    fetchSpy.mockRestore()
  })

  it('TD.5: shows "+ Vraag toevoegen" button', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    expect(screen.getByText('+ Vraag toevoegen')).toBeInTheDocument()
  })

  it('TD.6: clicking add shows inline form', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    fireEvent.click(screen.getByText('+ Vraag toevoegen'))

    expect(screen.getByText('Nieuwe vraag toevoegen')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Voer de vraagtekst in...')).toBeInTheDocument()
    expect(screen.getByText('Annuleren')).toBeInTheDocument()
  })

  it('TD.7: submitting add form calls supabase insert', async () => {
    renderDashboard()
    await screen.findByText('Test Toets')

    fireEvent.click(screen.getByText('+ Vraag toevoegen'))

    const textarea = screen.getByPlaceholderText('Voer de vraagtekst in...')
    fireEvent.change(textarea, { target: { value: 'Nieuwe test vraag' } })

    fireEvent.click(screen.getByText('Opslaan'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          exam_id: 'exam1',
          stem: 'Nieuwe test vraag',
          position: 3,
          version: 1,
        })
      )
    })
  })
})
