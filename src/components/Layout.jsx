import React from 'react'
import { Box, Container } from '@mui/material'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  const { theme } = useTheme()
  const { isAuthenticated, isAdmin } = useAuth()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.backgroundColor,
        color: theme.textColor
      }}
    >
      <Header />
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
      <Footer />
    </Box>
  )
}

export default Layout
