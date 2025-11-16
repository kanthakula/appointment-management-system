import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keyframes } from '@emotion/react'
import { styled } from '@mui/material/styles'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider
} from '@mui/material'
import { ChatBubbleOutline, AutoAwesome } from '@mui/icons-material'
import { useTheme } from '../contexts/ThemeContext'
import AIRecommendations from '../components/AIRecommendations'

const blinkAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.08);
  }
`

const BlinkingTypography = styled(Typography)(({ theme }) => ({
  animation: `${blinkAnimation} 1.5s ease-in-out infinite`,
  display: 'inline-block'
}))

const HomePage = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false)
  const [nlMessage, setNlMessage] = useState('')
  const [nlLoading, setNlLoading] = useState(false)
  const [nlResults, setNlResults] = useState(null)

  useEffect(() => {
    fetchSlots()
    const handleFocus = () => {
      fetchSlots()
    }
    const handleRefreshSlots = () => {
      fetchSlots()
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('refreshSlots', handleRefreshSlots)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('refreshSlots', handleRefreshSlots)
    }
  }, [])

  const fetchSlots = async () => {
    try {
      const cacheBuster = `_t=${Date.now()}`
      const response = await fetch(`/api/timeslots?${cacheBuster}`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      } else {
        setError('Failed to load time slots')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
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
          email: userEmail || 'guest@example.com'
        })
      })

      const data = await response.json()
      setNlResults(data)

      if (data.matchingSlots && data.matchingSlots.length > 0) {
        const matchingSlotIds = data.matchingSlots.map(s => s.id)
        setSlots(prevSlots => 
          prevSlots.map(slot => ({
            ...slot,
            isHighlighted: matchingSlotIds.includes(slot.id)
          }))
        )
      }
    } catch (err) {
      setNlResults({ error: 'Failed to process. Please try again.' })
    } finally {
      setNlLoading(false)
    }
  }

  const handleSelectRecommendedSlot = (slot) => {
    navigate(`/register/${slot.id}`)
  }

  const handleSelectNaturalLanguageSlot = (slot) => {
    navigate(`/register/${slot.id}`)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: theme.primaryColor }} />
          <Typography sx={{ color: theme.primaryColor, fontWeight: 600 }}>
            Loading available appointments...
          </Typography>
        </Stack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ fontSize: '1.2rem' }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Grid container spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Main Content - Slots List */}
      <Grid item xs={12} md={8}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ color: theme.primaryColor, fontWeight: 700, mb: 1 }}>
            Available Appointment Slots
          </Typography>
          {slots && slots.length > 0 ? (
            <Typography variant="body1" sx={{ color: theme.textColor }}>
              Book your appointment slot below. You can reserve for up to 5 people per booking.
            </Typography>
          ) : null}
        </Box>

        {!slots || slots.length === 0 ? (
          <Card sx={{ 
            border: `2px solid ${theme.primaryColor}`,
            backgroundColor: '#FFF7ED',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            py: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <CardContent sx={{ 
              textAlign: 'center',
              width: '100%',
              px: 3
            }}>
              <BlinkingTypography 
                variant="h6" 
                sx={{ 
                  textAlign: 'center', 
                  color: '#92400E',
                  fontWeight: 700,
                  width: '100%',
                  display: 'block'
                }}
              >
                No appointment slots available at this time. Please check back later.
              </BlinkingTypography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {slots.map((slot) => (
              <Card
                key={slot.id}
                sx={{
                  border: slot.isHighlighted ? `3px solid #10B981` : `2px solid ${theme.secondaryColor}`,
                  backgroundColor: slot.isHighlighted ? '#F0FDF4' : 'white',
                  boxShadow: slot.isHighlighted 
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: theme.primaryColor, fontWeight: 600, mb: 1 }}>
                    {formatDate(slot.date)} at {slot.start}
                    {slot.end && ` - ${slot.end}`}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2, color: theme.textColor }}>
                    <strong>Available seats:</strong> {slot.remaining || slot.capacity} out of {slot.capacity}
                  </Typography>

                  {slot.remaining > 0 ? (
                    <Button
                      component={Link}
                      to={`/register/${slot.id}`}
                      variant="contained"
                      sx={{
                        backgroundColor: theme.secondaryColor,
                        '&:hover': { backgroundColor: theme.secondaryColor, opacity: 0.9 }
                      }}
                    >
                      Reserve Slot
                    </Button>
                  ) : (
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Chip label="Full / Unavailable" color="default" />
                      {slot.waitlistCapacity > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            component={Link}
                            to={slot.waitlistFull ? '#' : `/waitlist/${slot.id}`}
                            onClick={(e) => {
                              if (slot.waitlistFull) {
                                e.preventDefault()
                              }
                            }}
                            variant="contained"
                            disabled={slot.waitlistFull}
                            sx={{
                              backgroundColor: slot.waitlistFull ? '#9CA3AF' : '#DC2626',
                              '&:hover': { 
                                backgroundColor: slot.waitlistFull ? '#9CA3AF' : '#B91C1C' 
                              }
                            }}
                          >
                            {slot.waitlistFull ? 'Waitlist Full' : 'Add to Waitlist'}
                          </Button>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: slot.waitlistFull ? '#DC2626' : '#6B7280',
                              fontWeight: slot.waitlistFull ? 'bold' : 'normal'
                            }}
                          >
                            (Waitlist: {slot.waitlistCount || 0}/{slot.waitlistCapacity || 0})
                          </Typography>
                        </Stack>
                      )}
                      {(!slot.waitlistCapacity || slot.waitlistCapacity === 0) && (
                        <Typography variant="caption" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                          Waitlist not available
                        </Typography>
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Grid>

      {/* Sidebar - AI Features */}
      <Grid item xs={12} md={4}>
        {/* Natural Language Booking Section */}
        <Card sx={{ mb: 3, border: `2px solid ${theme.accentColor || theme.primaryColor}` }}>
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
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Your email (optional, for recommendations)"
                  fullWidth
                  size="small"
                />
                <TextField
                  type="text"
                  value={nlMessage}
                  onChange={(e) => setNlMessage(e.target.value)}
                  placeholder='Try: "Book me for next Sunday afternoon" or "Find slots on November 3rd"'
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
                  <Alert 
                    severity={nlResults.error ? 'error' : 'success'}
                    sx={{ mt: 1 }}
                  >
                    {nlResults.error ? (
                      <Typography variant="body2">{nlResults.error}</Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {nlResults.message}
                        </Typography>
                        {nlResults.matchingSlots && nlResults.matchingSlots.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                              Found {nlResults.matchingSlots.length} slot(s):
                            </Typography>
                            <Stack spacing={1}>
                              {nlResults.matchingSlots.slice(0, 5).map((slot) => (
                                <Paper
                                  key={slot.id}
                                  onClick={() => handleSelectNaturalLanguageSlot(slot)}
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
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                              Matching slots are highlighted in green on the left
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Alert>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations - Show when email is entered */}
        {userEmail && userEmail.includes('@') && (
          <AIRecommendations
            email={userEmail}
            onSelectSlot={handleSelectRecommendedSlot}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default HomePage
