import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
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
    // Fetch timeslot details if timeslotId is provided
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

      // If slots found and user wants to book, navigate to first slot
      if (data.matchingSlots && data.matchingSlots.length > 0 && data.intent.action === 'book') {
        // Auto-select first matching slot
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
    // Scroll to booking form
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

  const formStyles = {
    maxWidth: '400px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }

  const inputStyles = {
    width: '100%',
    padding: '0.75rem',
    margin: '0.5rem 0',
    border: `2px solid #E5E7EB`,
    borderRadius: '6px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  }

  const buttonStyles = {
    width: '100%',
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  }

  const linkStyles = {
    color: theme.primaryColor,
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    marginTop: '1rem'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={formStyles}>
        <h2 style={{ 
          textAlign: 'center', 
          color: theme.primaryColor,
          marginBottom: '2rem'
        }}>
          Book Your Appointment
        </h2>

        {timeslot && (
          <div style={{
            backgroundColor: '#F3F4F6',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <h3 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              Selected Time Slot
            </h3>
            <p><strong>Date:</strong> {new Date(timeslot.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {timeslot.start} - {timeslot.end}</p>
            <p><strong>Available Spots:</strong> {timeslot.remaining} of {timeslot.capacity}</p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Natural Language Booking Section */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: `2px solid ${theme.accentColor || theme.primaryColor || '#3B82F6'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              margin: 0,
              color: theme.primaryColor,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💬 Book with Natural Language
            </h3>
            <button
              onClick={() => setShowNaturalLanguage(!showNaturalLanguage)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.primaryColor,
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {showNaturalLanguage ? 'Hide' : 'Try it'}
            </button>
          </div>

          {showNaturalLanguage && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={nlMessage}
                  onChange={(e) => setNlMessage(e.target.value)}
                  placeholder='Try: "Book me for next Sunday afternoon for 3 people" or "Find me slots tomorrow morning"'
                  style={{
                    ...inputStyles,
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNaturalLanguageBooking()
                    }
                  }}
                />
              </div>
              <button
                onClick={handleNaturalLanguageBooking}
                disabled={nlLoading || !nlMessage.trim()}
                style={{
                  ...buttonStyles,
                  marginBottom: '1rem',
                  opacity: (nlLoading || !nlMessage.trim()) ? 0.6 : 1
                }}
              >
                {nlLoading ? 'Processing...' : '✨ Find Slots'}
              </button>

              {nlResults && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: nlResults.error ? '#FEE2E2' : '#D1FAE5',
                  borderRadius: '6px',
                  color: nlResults.error ? '#DC2626' : '#065F46'
                }}>
                  {nlResults.error ? (
                    <p style={{ margin: 0 }}>{nlResults.error}</p>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                        {nlResults.message}
                      </p>
                      {nlResults.matchingSlots && nlResults.matchingSlots.length > 0 && (
                        <div>
                          <p style={{ margin: '0.5rem 0', fontSize: '14px' }}>
                            Found {nlResults.matchingSlots.length} slot(s):
                          </p>
                          {nlResults.matchingSlots.slice(0, 3).map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => handleSelectRecommendedSlot(slot)}
                              style={{
                                padding: '0.75rem',
                                margin: '0.5rem 0',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: `2px solid ${theme.primaryColor}`,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <strong>{new Date(slot.date).toLocaleDateString()}</strong> at {slot.start}
                              {slot.end && ` - ${slot.end}`}
                              <br />
                              <small style={{ color: '#6B7280' }}>
                                {slot.remaining} spots remaining
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Recommendations - Show when email is entered */}
        {formData.email && formData.email.includes('@') && (
          <AIRecommendations
            email={formData.email}
            onSelectSlot={handleSelectRecommendedSlot}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="yourname@example.com"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="555-123-4567"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Number of Attendees *
            </label>
            <input
              type="number"
              name="partySize"
              value={formData.partySize}
              onChange={handleChange}
              required
              min="1"
              max={theme.maxAttendees || 5}
              style={inputStyles}
            />
            <small style={{ color: '#6B7280', fontSize: '0.9rem' }}>
              Maximum {theme.maxAttendees || 5} people per booking
            </small>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                name="recurringVisitor"
                checked={formData.recurringVisitor}
                onChange={handleChange}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: theme.primaryColor
                }}
              />
              <span style={{ 
                color: theme.textColor
              }}>
                I am a recurring visitor (save my information for future bookings)
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={buttonStyles}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>

        <Link to="/" style={linkStyles}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}

export default BookingPage