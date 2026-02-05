import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          MC Toets
        </Link>
        <div className="flex gap-4">
          <Link to="/exams/upload" className="text-gray-600 hover:text-gray-900">
            Upload
          </Link>
          <Link to="/materials/upload" className="text-gray-600 hover:text-gray-900">
            Materiaal
          </Link>
          <Link to="/generate" className="text-gray-600 hover:text-gray-900">
            Genereer
          </Link>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Uitloggen
          </button>
        </div>
      )}
    </nav>
  )
}
