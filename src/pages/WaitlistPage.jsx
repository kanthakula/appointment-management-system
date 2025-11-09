import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Paper
} from '@mui/material'
import { useTheme } from '../contexts/ThemeContext'

const WaitlistPage = () => {
  const { timeslotId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const [timeslot, setTimeslot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    partySize: 1
  })

  useEffect(() => {
    fetchTimeslot()
  }, [timeslotId])

  const fetchTimeslot = async () => {
    try {
      const response = await fetch(`/api/timeslots/${timeslotId}`)
      if (response.ok) {
        const data = await response.json()
        setTimeslot(data)
      } else {
        setError('Time slot not found')
      }
    } catch (err) {
      setError('Failed to load time slot')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/waitlist/${timeslotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(result.message || 'Successfully added to waitlist!')
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshSlots'))
          navigate('/')
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add to waitlist')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: theme.primaryColor }} />
          <Typography sx={{ color: theme.primaryColor, fontWeight: 600 }}>
            Loading...
          </Typography>
        </Stack>
      </Box>
    )
  }

  if (!timeslot) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ fontSize: '1.2rem' }}>
          {error || 'Time slot not found'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Card sx={{ maxWidth: 600, width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h2" sx={{ color: theme.primaryColor, mb: 3, textAlign: 'center', fontWeight: 700 }}>
            Join Waitlist
          </Typography>
          
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: '#FEF3C7', 
            border: '2px solid #FCD34D',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#92400E', mb: 1 }}>
              {formatDate(timeslot.date)} at {timeslot.start}
              {timeslot.end && ` - ${timeslot.end}`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350F' }}>
              This slot is currently full. Join the waitlist and we'll notify you if a spot becomes available.
            </Typography>
          </Paper>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                fullWidth
                placeholder="Enter your full name"
              />

              <TextField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
                placeholder="your@email.com"
              />

              <TextField
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                fullWidth
                placeholder="+1 (555) 123-4567"
              />

              <TextField
                label="Number of People"
                type="number"
                name="partySize"
                value={formData.partySize}
                onChange={handleChange}
                required
                inputProps={{ min: 1, max: 5 }}
                fullWidth
                helperText="Maximum 5 people per waitlist entry"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                sx={{
                  py: 1.5,
                  backgroundColor: '#DC2626',
                  '&:hover': { backgroundColor: '#B91C1C' }
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Add to Waitlist'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              onClick={() => navigate('/')}
              variant="outlined"
              sx={{
                borderColor: theme.primaryColor,
                color: theme.primaryColor,
                '&:hover': { borderColor: theme.primaryColor, backgroundColor: 'rgba(0,0,0,0.04)' }
              }}
            >
              ← Back to Available Slots
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default WaitlistPage
