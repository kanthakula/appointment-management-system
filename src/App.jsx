import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BookingPage from './pages/BookingPage'
import WaitlistPage from './pages/WaitlistPage'
import AdminDashboard from './pages/AdminDashboard'
import CheckInPage from './pages/CheckInPage'
import ConfirmationPage from './pages/ConfirmationPage'

// Component to sync MUI theme with custom theme
const MUIThemeWrapper = ({ children }) => {
  const { theme } = useTheme()
  
  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      primary: {
        main: theme.primaryColor || '#4F46E5',
      },
      secondary: {
        main: theme.secondaryColor || '#10B981',
      },
      error: {
        main: '#DC2626',
      },
      success: {
        main: '#10B981',
      },
      warning: {
        main: theme.accentColor || '#F59E0B',
      },
      background: {
        default: theme.backgroundColor || '#F9FAFB',
        paper: '#FFFFFF',
      },
      text: {
        primary: theme.textColor || '#111827',
        secondary: '#6B7280',
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  }), [theme])

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <MUIThemeWrapper>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/:timeslotId" element={<BookingPage />} />
              <Route path="/waitlist/:timeslotId" element={<WaitlistPage />} />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/checkin" element={<CheckInPage />} />
              <Route path="/confirmed/:registrationId" element={<ConfirmationPage />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </MUIThemeWrapper>
    </ThemeProvider>
  )
}

export default App
