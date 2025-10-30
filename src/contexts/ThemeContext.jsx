import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    organizationName: 'DarshanFlow',
    logo: null,
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    backgroundColor: '#F9FAFB',
    textColor: '#111827',
    timezone: 'America/Chicago',
    allowUserRegistration: true,
    maxAttendees: 5
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load theme from API
    fetchTheme()
  }, [])

  const fetchTheme = async () => {
    try {
      const response = await fetch('/api/config/theme')
      if (response.ok) {
        const themeData = await response.json()
        setTheme(prev => ({ ...prev, ...themeData }))
      } else {
        console.error('Theme API response not ok:', response.status)
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTheme = async (newTheme) => {
    try {
      const response = await fetch('/api/config/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTheme),
      })
      
      if (response.ok) {
        setTheme(prev => ({ ...prev, ...newTheme }))
        return true
      }
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
    return false
  }

  const value = {
    theme,
    updateTheme,
    loading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
