import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
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
  Paper,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material'
import { ChatBubbleOutline, AutoAwesome } from '@mui/icons-material'
import { useTheme } from '../contexts/ThemeContext'
import AIRecommendations from '../components/AIRecommendations'

const BookingPage = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { timeslotId } = useParams()
  
  const [timeslot, setTimeslot] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    partySize: 1,
    recurringVisitor: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false)
  const [nlMessage, setNlMessage] = useState('')
  const [nlLoading, setNlLoading] = useState(false)
  const [nlResults, setNlResults] = useState(null)

  useEffect(() => {
    if (timeslotId) {
      fetchTimeslotDetails()
    }
  }, [timeslotId])

  const fetchTimeslotDetails = async () => {
    try {
      const response = await fetch('/api/timeslots')
      if (response.ok) {
        const timeslots = await response.json()
        const slot = timeslots.find(t => t.id === timeslotId)
        if (slot) {
          setTimeslot(slot)
        } else {
          setError('Time slot not found')
        }
      }
    } catch (err) {
      setError('Failed to load time slot details')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNaturalLanguageBooking = async () => {
    if (!nlMessage.trim()) return

    setNlLoading(true)
    setNlResults(null)

    try {
      const response = await fetch('/api/booking/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: nlMessage,
          email: formData.email || 'guest@example.com'
        })
      })

      const data = await response.json()
      setNlResults(data)

      if (data.matchingSlots && data.matchingSlots.length > 0 && data.intent.action === 'book') {
        const firstSlot = data.matchingSlots[0]
        setTimeslot(firstSlot)
      }
    } catch (err) {
      setNlResults({ error: 'Failed to process. Please try again.' })
    } finally {
      setNlLoading(false)
    }
  }

  const handleSelectRecommendedSlot = (slot) => {
    setTimeslot(slot)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timeslotId: timeslotId || timeslot?.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        navigate(`/confirmed/${result.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Booking failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
    
    setLoading(false)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Grid container spacing={3} sx={{ maxWidth: 1000 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h2" sx={{ textAlign: 'center', color: theme.primaryColor, fontWeight: 700, mb: 3 }}>
                Book Your Appointment
              </Typography>

              {timeslot && (
                <Paper sx={{ p: 2, mb: 3, backgroundColor: '#F3F4F6' }}>
                  <Typography variant="h6" sx={{ color: theme.primaryColor, mb: 1 }}>
                    Selected Time Slot
                  </Typography>
                  <Typography variant="body1"><strong>Date:</strong> {new Date(timeslot.date).toLocaleDateString()}</Typography>
                  <Typography variant="body1"><strong>Time:</strong> {timeslot.start} - {timeslot.end}</Typography>
                  <Typography variant="body1"><strong>Available Spots:</strong> {timeslot.remaining} of {timeslot.capacity}</Typography>
                </Paper>
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
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    fullWidth
                    placeholder="yourname@example.com"
                  />

                  <TextField
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    fullWidth
                    placeholder="555-123-4567"
                  />

                  <TextField
                    label="Number of Attendees"
                    type="number"
                    name="partySize"
                    value={formData.partySize}
                    onChange={handleChange}
                    required
                    inputProps={{ min: 1, max: theme.maxAttendees || 5 }}
                    fullWidth
                    helperText={`Maximum ${theme.maxAttendees || 5} people per booking`}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        name="recurringVisitor"
                        checked={formData.recurringVisitor}
                        onChange={handleChange}
                        sx={{ color: theme.primaryColor }}
                      />
                    }
                    label="I am a recurring visitor (save my information for future bookings)"
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Book Appointment'}
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
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Natural Language Booking Section */}
          <Card sx={{ mb: 2, border: `2px solid ${theme.accentColor || theme.primaryColor}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ChatBubbleOutline sx={{ color: theme.primaryColor }} />
                  <Typography variant="h6" sx={{ color: theme.primaryColor, fontWeight: 600 }}>
                    Book with Natural Language
                  </Typography>
                </Stack>
                <Button
                  onClick={() => setShowNaturalLanguage(!showNaturalLanguage)}
                  size="small"
                  sx={{ color: theme.primaryColor, textTransform: 'none' }}
                >
                  {showNaturalLanguage ? 'Hide' : 'Try it'}
                </Button>
              </Stack>

              {showNaturalLanguage && (
                <Stack spacing={2}>
                  <TextField
                    type="text"
                    value={nlMessage}
                    onChange={(e) => setNlMessage(e.target.value)}
                    placeholder='Try: "Book me for next Sunday afternoon for 3 people"'
                    fullWidth
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNaturalLanguageBooking()
                      }
                    }}
                  />
                  <Button
                    onClick={handleNaturalLanguageBooking}
                    disabled={nlLoading || !nlMessage.trim()}
                    variant="contained"
                    fullWidth
                    startIcon={nlLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                    sx={{
                      backgroundColor: theme.primaryColor,
                      '&:hover': { backgroundColor: theme.primaryColor, opacity: 0.9 }
                    }}
                  >
                    {nlLoading ? 'Processing...' : 'Find Slots'}
                  </Button>

                  {nlResults && (
                    <Alert severity={nlResults.error ? 'error' : 'success'}>
                      {nlResults.error ? (
                        <Typography variant="body2">{nlResults.error}</Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {nlResults.message}
                          </Typography>
                          {nlResults.matchingSlots && nlResults.matchingSlots.length > 0 && (
                            <Stack spacing={1}>
                              {nlResults.matchingSlots.slice(0, 3).map((slot) => (
                                <Paper
                                  key={slot.id}
                                  onClick={() => handleSelectRecommendedSlot(slot)}
                                  sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    border: `2px solid ${theme.primaryColor}`,
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    },
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {new Date(slot.date).toLocaleDateString()} at {slot.start}
                                    {slot.end && ` - ${slot.end}`}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                    {slot.remaining} spots remaining
                                  </Typography>
                                </Paper>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      )}
                    </Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {formData.email && formData.email.includes('@') && (
            <AIRecommendations
              email={formData.email}
              onSelectSlot={handleSelectRecommendedSlot}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default BookingPage
