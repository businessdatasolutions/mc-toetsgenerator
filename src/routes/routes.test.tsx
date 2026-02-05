import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'

// Mock useAuth to always return authenticated
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: '1', email: 'test@test.com' } },
    user: { id: '1', email: 'test@test.com' },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

// Import after mocks
const { default: App } = await import('../App')
const { default: ProtectedRoute } = await import('../components/Layout/ProtectedRoute')
const { default: ExamUpload } = await import('./ExamUpload')

describe('Router navigation', () => {
  it('renders ExamUpload at /exams/upload', () => {
    const router = createMemoryRouter(
      [
        {
          element: <App />,
          children: [
            {
              element: <ProtectedRoute />,
              children: [
                { path: 'exams/upload', element: <ExamUpload /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ['/mc-toetsgenerator/exams/upload'], basename: '/mc-toetsgenerator' }
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByText('Toets uploaden')).toBeInTheDocument()
  })
})
