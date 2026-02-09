import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Heatmap from './Heatmap'
import type { QuestionWithAssessment } from '../hooks/useQuestions'

function makeQuestion(
  id: string,
  position: number,
  bet: number,
  tech: number,
  val: number
): QuestionWithAssessment {
  return {
    id,
    exam_id: 'exam1',
    position,
    stem: `Vraag ${position + 1}`,
    options: [
      { text: 'A', position: 0, is_correct: true },
      { text: 'B', position: 1 },
      { text: 'C', position: 2 },
      { text: 'D', position: 3 },
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
        id: `a-${id}`,
        question_id: id,
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
        assessed_at: '2024-01-01',
        created_at: '2024-01-01',
      },
    ],
  }
}

describe('Heatmap', () => {
  it('T9.4: renders 5 rows and 3 score columns for 5 questions', () => {
    const questions = [
      makeQuestion('q1', 0, 4, 3, 5),
      makeQuestion('q2', 1, 2, 4, 3),
      makeQuestion('q3', 2, 5, 5, 4),
      makeQuestion('q4', 3, 1, 2, 2),
      makeQuestion('q5', 4, 3, 3, 3),
    ]

    render(<Heatmap questions={questions} />)

    // 5 rows in tbody
    const tbody = document.querySelector('tbody')!
    const rows = tbody.querySelectorAll('tr')
    expect(rows.length).toBe(5)

    // Each row has 4 cells (# + B + T + V)
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td')
      expect(cells.length).toBe(4)
    })

    // Check header columns
    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('renders score values in cells', () => {
    const questions = [makeQuestion('q1', 0, 4, 3, 5)]
    render(<Heatmap questions={questions} />)

    const tbody = document.querySelector('tbody')!
    const cells = tbody.querySelectorAll('td')
    // First cell is position (1), then scores (4, 3, 5)
    expect(cells[0]).toHaveTextContent('1')
    expect(cells[1]).toHaveTextContent('4')
    expect(cells[2]).toHaveTextContent('3')
    expect(cells[3]).toHaveTextContent('5')
  })
})
