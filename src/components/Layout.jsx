import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  const { theme } = useTheme()
  const { isAuthenticated, isAdmin } = useAuth()

  const styles = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <div style={styles}>
      <Header />
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
