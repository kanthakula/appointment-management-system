import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false }) => {
  const { user, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#4F46E5'
      }}>
        Loading...
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If admin access is required but user is not admin/super admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // If super admin access is required but user is not super admin
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />
  }

  // If all checks pass, render the protected component
  return children
}

export default ProtectedRoute










