import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BookingPage from './pages/BookingPage'
import AdminDashboard from './pages/AdminDashboard'
import CheckInPage from './pages/CheckInPage'
import ConfirmationPage from './pages/ConfirmationPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/:timeslotId" element={<BookingPage />} />
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
    </ThemeProvider>
  )
}

export default App
