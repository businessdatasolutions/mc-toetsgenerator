import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuth
const mockUseAuth = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('ProtectedRoute', () => {
  it('renders children when session is present', () => {
    mockUseAuth.mockReturnValue({ session: { user: {} }, loading: false })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when session is null', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('shows loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Laden...')).toBeInTheDocument()
  })
})
