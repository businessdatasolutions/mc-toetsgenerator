import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'

const { mockFrom, mockGetSession } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
}))

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}))

// Mock fetch for Edge Function call
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import GenerateSpec from './GenerateSpec'

describe('GenerateSpec', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock materials query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'materials') {
        return {
          select: () => ({
            gt: () => ({
              order: () => ({
                then: (cb: (result: { data: unknown[] }) => void) => {
                  cb({
                    data: [
                      {
                        id: 'mat-1',
                        filename: 'studiemateriaal.pdf',
                        chunk_count: 10,
                        uploaded_by: 'user-1',
                        exam_id: null,
                        mime_type: 'application/pdf',
                        storage_path: 'materials/test.pdf',
                        content_text: null,
                        created_at: '2024-01-01',
                      },
                    ],
                  })
                  return { catch: () => {} }
                },
              }),
            }),
          }),
        }
      }
      if (table === 'exams') {
        return {
          select: () => ({
            order: () => ({
              then: (cb: (result: { data: unknown[] }) => void) => {
                cb({
                  data: [{ id: 'exam-1', title: 'Test Toets' }],
                })
                return { catch: () => {} }
              },
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ job_id: 'job-123' }),
    })
  })

  it('T14.2: renders all form fields', async () => {
    render(
      <MemoryRouter>
        <GenerateSpec />
      </MemoryRouter>
    )

    expect(screen.getByText('Vragen genereren')).toBeInTheDocument()
    expect(screen.getByLabelText(/Studiemateriaal/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Aantal vragen/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bloom-niveau/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Leerdoel/)).toBeInTheDocument()
    expect(screen.getByText('3 opties')).toBeInTheDocument()
    expect(screen.getByText('4 opties')).toBeInTheDocument()
  })

  it('T14.2: submits form and calls Edge Function with specification', async () => {
    render(
      <MemoryRouter>
        <GenerateSpec />
      </MemoryRouter>
    )

    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByText(/studiemateriaal\.pdf/)).toBeInTheDocument()
    })

    // Select material
    fireEvent.change(screen.getByLabelText(/Studiemateriaal/), {
      target: { value: 'mat-1' },
    })

    // Set count
    fireEvent.change(screen.getByLabelText(/Aantal vragen/), {
      target: { value: '3' },
    })

    // Set Bloom level
    fireEvent.change(screen.getByLabelText(/Bloom-niveau/), {
      target: { value: 'toepassen' },
    })

    // Set learning goal
    fireEvent.change(screen.getByLabelText(/Leerdoel/), {
      target: { value: 'Student kan constructive alignment toepassen' },
    })

    // Submit
    fireEvent.click(screen.getByText('Genereer vragen'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/generate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"bloom_level":"toepassen"'),
        })
      )
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/generate/job-123/review')
    })
  })
})
