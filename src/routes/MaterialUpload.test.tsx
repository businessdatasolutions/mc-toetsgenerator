import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'

const { mockUpload, mockInsert, mockGetSession } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockInsert: vi.fn(),
  mockGetSession: vi.fn(),
}))

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
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { chunk_count: 0 } }),
        }),
      }),
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
    auth: {
      getSession: mockGetSession,
    },
  },
}))

// Mock fetch for Edge Function call
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import MaterialUpload from './MaterialUpload'

describe('MaterialUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({
      data: { id: 'mat-test-id' },
      error: null,
    })
    mockUpload.mockResolvedValue({ error: null })
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'processing' }),
    })
  })

  it('T14.1: renders upload form with file input', () => {
    render(
      <MemoryRouter>
        <MaterialUpload />
      </MemoryRouter>
    )

    expect(screen.getByText('Studiemateriaal uploaden')).toBeInTheDocument()
    expect(screen.getByTestId('material-uploader')).toBeInTheDocument()
    expect(screen.getByText(/Uploaden & verwerken/)).toBeInTheDocument()
  })

  it('T14.1: submits file and calls storage upload and materials insert', async () => {
    render(
      <MemoryRouter>
        <MaterialUpload />
      </MemoryRouter>
    )

    // Select a file
    const fileInput = screen.getByTestId('material-file-input')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit
    fireEvent.click(screen.getByText(/Uploaden & verwerken/))

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })

    // Edge Function should be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/embed-material'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})
