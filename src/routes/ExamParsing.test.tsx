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

const validValidationResponse = {
  is_valid: true,
  total_questions: 3,
  valid_count: 3,
  invalid_count: 0,
  results: [
    { question_index: 0, question_id: '1', is_valid: true, errors: [], warnings: [] },
    { question_index: 1, question_id: '2', is_valid: true, errors: [], warnings: [] },
    { question_index: 2, question_id: '3', is_valid: true, errors: [], warnings: [] },
  ],
}

const invalidValidationResponse = {
  is_valid: false,
  total_questions: 3,
  valid_count: 1,
  invalid_count: 2,
  results: [
    {
      question_index: 0,
      question_id: '1',
      is_valid: false,
      errors: [{ field: 'category', code: 'empty_category', message: 'Onderwerpcategorie ontbreekt' }],
      warnings: [],
    },
    {
      question_index: 1,
      question_id: '2',
      is_valid: false,
      errors: [{ field: 'category', code: 'empty_category', message: 'Onderwerpcategorie ontbreekt' }],
      warnings: [],
    },
    { question_index: 2, question_id: '3', is_valid: true, errors: [], warnings: [] },
  ],
}

const mockRepairPlan = {
  proposals: [
    {
      question_index: 0,
      field: 'category',
      current_value: null,
      proposed_value: 'Onderwijskunde',
      explanation: 'De vraag gaat over constructive alignment.',
    },
    {
      question_index: 1,
      field: 'category',
      current_value: null,
      proposed_value: 'Toetsdidactiek',
      explanation: 'De vraag gaat over Bloom-niveaus.',
    },
  ],
  summary: '2 categorieën aangevuld voor 2 vragen.',
}

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

  it('T10.7: save works after successful validation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(validValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    // Save button should be disabled before validation
    const saveButton = screen.getByText('Opslaan & Analyseren')
    expect(saveButton).toBeDisabled()

    // Validate
    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText(/3 van 3/)).toBeInTheDocument()
    })

    // Now save should be enabled
    expect(saveButton).not.toBeDisabled()

    // Click save
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })
  })
})

describe('ExamParsing — validation flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockList.mockResolvedValue({ data: [{ name: 'vragen.csv' }] })
    mockDownload.mockResolvedValue({ data: new Blob(['test']), error: null })
    mockInsert.mockResolvedValue({ error: null })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('shows Valideren button after parsing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })
  })

  it('save button is disabled before validation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Wat is constructive alignment?')).toBeInTheDocument()
    })

    expect(screen.getByText('Opslaan & Analyseren')).toBeDisabled()
  })

  it('shows validation errors after failed validation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(invalidValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText(/1 van 3/)).toBeInTheDocument()
    })

    // Error messages should be visible
    expect(screen.getByText('Validatiefouten overzicht')).toBeInTheDocument()

    // Save button should remain disabled
    expect(screen.getByText('Opslaan & Analyseren')).toBeDisabled()
  })

  it('shows Categorie column in table', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Categorie')).toBeInTheDocument()
    })
  })

  it('shows dirty validation notice when questions change after validation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(validValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })

    // Validate successfully
    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText(/3 van 3/)).toBeInTheDocument()
    })

    // Delete a question to make validation dirty
    const deleteButtons = screen.getAllByTitle('Vraag verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText(/Gegevens gewijzigd/)).toBeInTheDocument()
    expect(screen.getByText('Opslaan & Analyseren')).toBeDisabled()
  })
})

describe('ExamParsing — AI repair flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockList.mockResolvedValue({ data: [{ name: 'vragen.csv' }] })
    mockDownload.mockResolvedValue({ data: new Blob(['test']), error: null })
    mockInsert.mockResolvedValue({ error: null })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('shows AI Reparatie button when validation has errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(invalidValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText('AI Reparatie')).toBeInTheDocument()
    })
  })

  it('shows repair plan after clicking AI Reparatie', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(invalidValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/repair')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockRepairPlan), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText('AI Reparatie')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('AI Reparatie'))

    await waitFor(() => {
      expect(screen.getByText('AI Reparatieplan')).toBeInTheDocument()
    })

    // Should show repair proposals
    expect(screen.getByText(/Onderwijskunde/)).toBeInTheDocument()
    expect(screen.getByText(/Toetsdidactiek/)).toBeInTheDocument()
    expect(screen.getByText('Toepassen')).toBeInTheDocument()
    expect(screen.getByText('Annuleren')).toBeInTheDocument()
  })

  it('cancel hides repair plan', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/parse')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockQuestions), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve(
          new Response(JSON.stringify(invalidValidationResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (typeof url === 'string' && url.includes('/repair')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockRepairPlan), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Valideren')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Valideren'))

    await waitFor(() => {
      expect(screen.getByText('AI Reparatie')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('AI Reparatie'))

    await waitFor(() => {
      expect(screen.getByText('AI Reparatieplan')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Annuleren'))

    expect(screen.queryByText('AI Reparatieplan')).not.toBeInTheDocument()
  })
})
