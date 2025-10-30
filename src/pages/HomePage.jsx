import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const HomePage = () => {
  const { theme } = useTheme()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
          <div key={slot.id} style={slotCardStyles}>
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
              <div style={fullButtonStyles}>
                Full / Unavailable
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default HomePage
