import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('Checking authentication status...')
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Auth check response:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User authenticated:', userData.email)
        console.log('User data received:', {
          roles: userData.roles,
          permissions: userData.permissions,
          role: userData.role,
          roleDetails: userData.roleDetails
        })
        setUser(userData)
        setIsAuthenticated(true)
      } else if (response.status === 401) {
        console.log('User not authenticated (401)')
        const errorData = await response.json().catch(() => null)
        console.log('Auth error data:', errorData)
        setUser(null)
        setIsAuthenticated(false)
        
        // If we're on an admin page and get 401, redirect to login
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login'
        }
      } else {
        console.log('Auth check failed with status:', response.status)
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check network error:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      console.log('Login response status:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('Login successful:', userData.email)
        setUser(userData)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        const error = await response.text()
        console.error('Login failed:', error)
        return { success: false, error }
      }
    } catch (error) {
      console.error('Login network error:', error)
      return { success: false, error: `Network error: ${error.message}` }
    }
  }

  const logout = async () => {
    try {
      console.log('Attempting logout...')
      
      // Clear local state immediately
      setUser(null)
      setIsAuthenticated(false)
      
      // Make logout API call
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Logout response status:', response.status)
      
      if (response.ok) {
        console.log('Logout API call successful')
        const result = await response.json()
        console.log('Logout response:', result)
      } else {
        console.error('Logout response error:', response.status)
        // Even if API fails, continue with logout
      }
    } catch (error) {
      console.error('Logout API error:', error)
      // Even if API fails, continue with logout
    }
    
    // Clear any local storage
    try {
      localStorage.clear()
      sessionStorage.clear()
      
      // Try to clear cookies from client side as backup
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
    } catch (e) {
      console.log('Could not clear storage/cookies:', e)
    }
    
    // Force navigation to home page with full page reload
    console.log('Redirecting to home page...')
    window.location.replace('/')
  }

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const newUser = await response.json()
        setUser(newUser)
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const value = {
    user,
    login,
    logout,
    register,
    loading,
    isAuthenticated,
    // Legacy role checks for backward compatibility
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.roles?.includes('admin') || user?.roles?.includes('super_admin'),
    isSuperAdmin: user?.role === 'super_admin' || user?.roles?.includes('super_admin'),
    isCheckinUser: user?.role === 'checkin_user' || user?.roles?.includes('checkin_user'),
    isReporting: user?.role === 'reporting' || user?.roles?.includes('reporting'),
    // New multi-role system
    roles: user?.roles || [],
    permissions: user?.permissions || [],
    roleDetails: user?.roleDetails || [],
    // Permission-based checks (with legacy fallback)
    canManageUsers: user?.permissions?.includes('manage_users') || user?.role === 'admin' || user?.role === 'super_admin',
    canCreateAdmins: user?.permissions?.includes('create_admin') || user?.permissions?.includes('manage_users') || user?.role === 'super_admin',
    canCreateSuperAdmins: user?.permissions?.includes('create_super_admin') || user?.role === 'super_admin',
    canCreateCheckinUsers: user?.permissions?.includes('create_checkin_user') || user?.permissions?.includes('manage_users') || user?.role === 'admin' || user?.role === 'super_admin',
    canCreateReportingUsers: user?.permissions?.includes('create_reporting_user') || user?.permissions?.includes('manage_users') || user?.role === 'admin' || user?.role === 'super_admin',
    canManageTimeslots: user?.permissions?.includes('manage_timeslots') || user?.role === 'admin' || user?.role === 'super_admin',
    canManageBookings: user?.permissions?.includes('manage_bookings') || user?.role === 'admin' || user?.role === 'super_admin',
    canViewReports: user?.permissions?.includes('view_reports') || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'reporting',
    canManageSettings: user?.permissions?.includes('manage_settings') || user?.role === 'super_admin',
    canViewAuditLogs: user?.permissions?.includes('view_audit_logs') || user?.role === 'admin' || user?.role === 'super_admin',
    canCheckinAttendees: user?.permissions?.includes('checkin_attendees') || user?.role === 'checkin_user' || user?.role === 'admin' || user?.role === 'super_admin',
    canViewBookings: user?.permissions?.includes('view_bookings') || user?.role === 'checkin_user' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'reporting',
    canViewTimeslots: user?.permissions?.includes('view_timeslots') || user?.role === 'checkin_user' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'reporting'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
