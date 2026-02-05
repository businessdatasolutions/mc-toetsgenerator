import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'

// Mock supabase before importing the component
const mockInsert = vi.fn()
const mockUpload = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: mockInsert,
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
  },
}))

import ExamUpload from './ExamUpload'

describe('ExamUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({
      data: { id: 'test-exam-id' },
      error: null,
    })
    mockUpload.mockResolvedValue({ error: null })
  })

  it('T8.6: submits form and calls supabase insert and upload', async () => {
    render(
      <MemoryRouter>
        <ExamUpload />
      </MemoryRouter>
    )

    // Fill in title
    fireEvent.change(screen.getByLabelText(/Toets titel/), {
      target: { value: 'Test Toets' },
    })

    // Drop a file
    const dropZone = screen.getByTestId('file-uploader')
    const file = new File(['test'], 'vragen.csv', { type: 'text/csv' })
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Uploaden/ }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/exams/test-exam-id/parse')
    })
  })

  it('renders all form fields', () => {
    render(
      <MemoryRouter>
        <ExamUpload />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Toets titel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Vaknaam/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Leerdoelen/)).toBeInTheDocument()
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument()
  })
})
