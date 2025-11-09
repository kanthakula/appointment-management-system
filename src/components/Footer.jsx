import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '../contexts/ThemeContext'

const Footer = () => {
  const { theme } = useTheme()

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.textColor,
        color: theme.backgroundColor,
        py: 2,
        px: 3,
        textAlign: 'center',
        mt: 'auto'
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} {theme.organizationName} - Appointment Management System
      </Typography>
    </Box>
  )
}

export default Footer
