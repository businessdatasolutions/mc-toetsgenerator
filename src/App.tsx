import { Outlet } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Layout/Navbar'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  )
}
