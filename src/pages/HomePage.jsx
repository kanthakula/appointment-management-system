import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import AIRecommendations from '../components/AIRecommendations'

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
  }, [])

  const fetchSlots = async () => {
    try {
      // Add cache-busting parameter to prevent stale data
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

      // If slots found and user wants to book, show them
      if (data.matchingSlots && data.matchingSlots.length > 0) {
        // Scroll to show results or highlight matching slots
        const matchingSlotIds = data.matchingSlots.map(s => s.id)
        // Highlight matching slots in the list
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
    // Navigate to booking page with selected slot
    navigate(`/register/${slot.id}`)
  }

  const handleSelectNaturalLanguageSlot = (slot) => {
    // Navigate to booking page with selected slot
    navigate(`/register/${slot.id}`)
  }

  const slotCardStyles = {
    backgroundColor: 'white',
    border: `2px solid ${theme.secondaryColor}`,
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1rem 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }

  const buttonStyles = {
    backgroundColor: theme.secondaryColor,
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem'
  }

  const fullButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
          Loading available appointments...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#EF4444', fontSize: '1.2rem' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Main Content - Slots List */}
      <div style={{ flex: '1', minWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Available Appointment Slots
          </h2>
          <p style={{ fontSize: '1.1rem', color: theme.textColor }}>
            Book your appointment slot below. You can reserve for up to 5 people per booking.
          </p>
        </div>

      {slots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: theme.textColor }}>
            No appointment slots available at this time. Please check back later.
          </div>
        </div>
      ) : (
        slots.map((slot) => (
          <div 
            key={slot.id} 
            style={{
              ...slotCardStyles,
              border: slot.isHighlighted 
                ? `3px solid #10B981` 
                : slotCardStyles.border,
              backgroundColor: slot.isHighlighted ? '#F0FDF4' : 'white',
              boxShadow: slot.isHighlighted ? '0 4px 12px rgba(16, 185, 129, 0.3)' : slotCardStyles.boxShadow,
              transition: 'all 0.3s'
            }}
          >
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: theme.primaryColor,
              fontSize: '1.3rem'
            }}>
              {formatDate(slot.date)} at {slot.start}
              {slot.end && ` - ${slot.end}`}
            </h3>
            
            <div style={{ 
              marginBottom: '1rem',
              fontSize: '1.1rem',
              color: theme.textColor
            }}>
              <strong>Available seats:</strong> {slot.remaining || slot.capacity} out of {slot.capacity}
            </div>

            {slot.remaining > 0 ? (
              <Link 
                to={`/register/${slot.id}`}
                style={buttonStyles}
              >
                Reserve Slot
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={fullButtonStyles}>
                  Full / Unavailable
                </div>
                <Link
                  to={`/waitlist/${slot.id}`}
                  style={{
                    ...buttonStyles,
                    backgroundColor: '#DC2626',
                    border: '2px solid #DC2626'
                  }}
                >
                  Add to Waitlist
                </Link>
              </div>
            )}
          </div>
        ))
      )}
      </div>

      {/* Sidebar - AI Features */}
      <div style={{ width: '400px', flexShrink: 0 }}>
        {/* Natural Language Booking Section */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          border: `2px solid ${theme.accentColor || theme.primaryColor || '#3B82F6'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
              gap: '8px',
              fontSize: '1.1rem'
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
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Your email (optional, for recommendations)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    border: `2px solid #E5E7EB`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  value={nlMessage}
                  onChange={(e) => setNlMessage(e.target.value)}
                  placeholder='Try: "Book me for next Sunday afternoon" or "Find slots on November 3rd"'
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid #E5E7EB`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
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
                  width: '100%',
                  backgroundColor: theme.primaryColor || '#3B82F6',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: (nlLoading || !nlMessage.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (nlLoading || !nlMessage.trim()) ? 0.6 : 1,
                  marginBottom: '1rem'
                }}
              >
                {nlLoading ? 'Processing...' : '✨ Find Slots'}
              </button>

              {nlResults && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: nlResults.error ? '#FEE2E2' : '#D1FAE5',
                  borderRadius: '6px',
                  color: nlResults.error ? '#DC2626' : '#065F46',
                  fontSize: '14px'
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
                          <p style={{ margin: '0.5rem 0', fontSize: '13px' }}>
                            Found {nlResults.matchingSlots.length} slot(s):
                          </p>
                          {nlResults.matchingSlots.slice(0, 5).map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => handleSelectNaturalLanguageSlot(slot)}
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
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                            Matching slots are highlighted in green on the left
                          </p>
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
        {userEmail && userEmail.includes('@') && (
          <AIRecommendations
            email={userEmail}
            onSelectSlot={handleSelectRecommendedSlot}
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
