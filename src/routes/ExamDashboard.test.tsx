import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockFrom, mockRpc, mockChannel, mockRemoveChannel, mockSubscribe } =
  vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockRpc: vi.fn(),
    mockChannel: vi.fn(),
    mockRemoveChannel: vi.fn(),
    mockSubscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
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

  mockRpc.mockResolvedValue({
    data: [{ avg_bet: 3.7, avg_tech: 4.0, avg_val: 4.0 }],
    error: null,
  })

  mockChannel.mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
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
})
