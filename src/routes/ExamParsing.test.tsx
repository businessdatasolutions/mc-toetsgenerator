import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockList, mockDownload, mockInsert } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockDownload: vi.fn(),
  mockInsert: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        list: mockList,
        download: mockDownload,
      }),
    },
    from: () => ({
      insert: mockInsert,
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

import ExamParsing from './ExamParsing'

const mockQuestions = [
  {
    stem: 'Wat is constructive alignment?',
    options: [
      { text: 'Afstemming van leerdoelen', position: 0, is_correct: true },
      { text: 'Een bouwkundige techniek', position: 1, is_correct: false },
      { text: 'Een lesmethode', position: 2, is_correct: false },
      { text: 'Een beoordelingscriterium', position: 3, is_correct: false },
    ],
  },
  {
    stem: 'Welk Bloom-niveau is het hoogst?',
    options: [
      { text: 'Onthouden', position: 0, is_correct: false },
      { text: 'Begrijpen', position: 1, is_correct: false },
      { text: 'Analyseren', position: 2, is_correct: true },
      { text: 'Toepassen', position: 3, is_correct: false },
    ],
  },
  {
    stem: 'Wat is een leerdoel?',
    options: [
      { text: 'Een competentie', position: 0, is_correct: true },
      { text: 'Een toets', position: 1, is_correct: false },
      { text: 'Een boek', position: 2, is_correct: false },
    ],
  },
]

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/exams/exam-1/parse']}>
      <Routes>
        <Route path="/exams/:examId/parse" element={<ExamParsing />} />
        <Route path="/exams/:examId" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExamParsing — add/delete questions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockList.mockResolvedValue({ data: [{ name: 'vragen.csv' }] })
    mockDownload.mockResolvedValue({ data: new Blob(['test']), error: null })
    mockInsert.mockResolvedValue({ error: null })

    // Mock the sidecar /parse fetch
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      // analyze edge function
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    // Mock window.confirm to always return true
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('T10.1: shows a delete button for each question row', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    expect(deleteButtons).toHaveLength(3)
  })

  it('T10.2: clicking delete removes the question from the table', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.queryByText('Wat is constructive alignment?')).not.toBeInTheDocument()
    expect(screen.getByText('Welk Bloom-niveau is het hoogst?')).toBeInTheDocument()
    expect(screen.getByText('Wat is een leerdoel?')).toBeInTheDocument()
  })

  it('T10.3: question numbering updates after deletion', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('3 vragen gevonden. Klik op een rij om te bewerken.')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText('2 vragen gevonden. Klik op een rij om te bewerken.')).toBeInTheDocument()
  })

  it('T10.4: editing panel closes when the edited question is deleted', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    // Click on first row to start editing
    const firstRow = screen.getByText('Wat is constructive alignment?').closest('tr')!
    fireEvent.click(firstRow)

    expect(screen.getByText('Vraag 1 bewerken')).toBeInTheDocument()

    // Delete the first question
    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.queryByText(/Vraag \d+ bewerken/)).not.toBeInTheDocument()
  })

  it('T10.5: "Vraag toevoegen" button is visible', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    expect(screen.getByText('+ Vraag toevoegen')).toBeInTheDocument()
  })

  it('T10.6: clicking add creates a new empty question and opens editor', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('3 vragen gevonden. Klik op een rij om te bewerken.')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Vraag toevoegen'))

    expect(screen.getByText('4 vragen gevonden. Klik op een rij om te bewerken.')).toBeInTheDocument()
    expect(screen.getByText('Vraag 4 bewerken')).toBeInTheDocument()

    // The new row should have 4 options
    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    expect(deleteButtons).toHaveLength(4)
  })

  it('T10.7: save works correctly with modified question list', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    // Delete first question, then save
    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    fireEvent.click(screen.getByText('Opslaan & Analyseren'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ stem: 'Welk Bloom-niveau is het hoogst?', position: 0 }),
          expect.objectContaining({ stem: 'Wat is een leerdoel?', position: 1 }),
        ])
      )
    })
  })
})
