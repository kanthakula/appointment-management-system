import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const { theme } = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error || 'Login failed')
    }
    
    setLoading(false)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', py: 4 }}>
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h2" sx={{ textAlign: 'center', color: theme.primaryColor, fontWeight: 700, mb: 3 }}>
            Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
                placeholder="admin@example.com"
                variant="outlined"
              />

              <TextField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                placeholder="Enter your password"
                variant="outlined"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  backgroundColor: theme.primaryColor,
                  '&:hover': { backgroundColor: theme.primaryColor, opacity: 0.9 }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              component={Link}
              to="/"
              sx={{ color: theme.primaryColor, textTransform: 'none' }}
            >
              ← Back to Home
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage
