import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

const Footer = () => {
  const { theme } = useTheme()

  const footerStyles = {
    backgroundColor: theme.textColor,
    color: theme.backgroundColor,
    padding: '1rem 2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    marginTop: 'auto'
  }

  return (
    <footer style={footerStyles}>
      <p style={{ margin: 0 }}>
        © 2024 {theme.organizationName} - Appointment Management System
      </p>
    </footer>
  )
}

export default Footer
