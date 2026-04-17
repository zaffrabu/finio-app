import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
