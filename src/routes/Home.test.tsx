import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'

const { mockFrom, mockDelete } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}))

import Home from './Home'

const mockExams = [
  {
    id: 'exam-1',
    title: 'Toets Organisatiekunde',
    course: 'Bedrijfskunde',
    analysis_status: 'completed',
    created_at: '2026-02-06T10:00:00Z',
  },
  {
    id: 'exam-2',
    title: 'Toets Statistiek',
    course: null,
    analysis_status: 'pending',
    created_at: '2026-02-05T10:00:00Z',
  },
]

function setupMocks(exams = mockExams, deleteError: { message: string } | null = null) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'exams') {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: exams }),
        }),
        delete: () => ({
          eq: mockDelete,
        }),
      }
    }
    return { select: vi.fn() }
  })

  mockDelete.mockResolvedValue({ error: deleteError })
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home — exam deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T12.1: shows a delete button for each exam', async () => {
    setupMocks()
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    expect(deleteButtons).toHaveLength(2)
  })

  it('T12.2: clicking delete button shows confirmation dialog', async () => {
    setupMocks()
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText(/Weet je zeker dat je/)).toBeInTheDocument()
    expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    expect(screen.getByText('Annuleren')).toBeInTheDocument()
  })

  it('T12.3: clicking cancel closes the confirmation dialog', async () => {
    setupMocks()
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText(/Weet je zeker/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Annuleren'))

    expect(screen.queryByText(/Weet je zeker/)).not.toBeInTheDocument()
  })

  it('T12.4: confirming delete calls supabase delete', async () => {
    setupMocks()
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    fireEvent.click(deleteButtons[0])

    fireEvent.click(screen.getByText('Verwijderen'))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('id', 'exam-1')
    })
  })

  it('T12.5: exam disappears from list after successful deletion', async () => {
    setupMocks()
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByText('Verwijderen'))

    await waitFor(() => {
      expect(screen.queryByText('Toets Organisatiekunde')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Toets Statistiek')).toBeInTheDocument()
  })

  it('T12.6: shows error message when deletion fails', async () => {
    setupMocks(mockExams, { message: 'Delete failed' })
    renderHome()

    await waitFor(() => {
      expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Toets verwijderen')
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByText('Verwijderen'))

    await waitFor(() => {
      expect(screen.getByText('Verwijderen mislukt. Probeer het opnieuw.')).toBeInTheDocument()
    })

    // Exam should still be in the list
    expect(screen.getByText('Toets Organisatiekunde')).toBeInTheDocument()
  })
})
