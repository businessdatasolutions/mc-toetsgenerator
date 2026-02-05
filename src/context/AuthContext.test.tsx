import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock supabase
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => mockOnAuthStateChange(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('returns null session and user when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('returns session and user when authenticated', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@test.com' },
      access_token: 'token',
    }
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockSession.user)
  })
})
