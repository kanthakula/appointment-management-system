import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

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