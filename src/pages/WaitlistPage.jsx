import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
        // Force refresh of home page data after a short delay
        setTimeout(() => {
          // Trigger a custom event to refresh slots on home page
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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!timeslot) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#EF4444', fontSize: '1.2rem' }}>
          {error || 'Time slot not found'}
        </div>
      </div>
    )
  }

  const formStyles = {
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }

  const inputStyles = {
    width: '100%',
    padding: '0.75rem',
    border: `2px solid #E5E7EB`,
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  }

  const buttonStyles = {
    width: '100%',
    backgroundColor: '#DC2626',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: theme.primaryColor, marginBottom: '1rem', textAlign: 'center' }}>
        Join Waitlist
      </h2>
      
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#FEF3C7',
        borderRadius: '6px',
        border: '2px solid #FCD34D'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400E' }}>
          {formatDate(timeslot.date)} at {timeslot.start}
          {timeslot.end && ` - ${timeslot.end}`}
        </h3>
        <p style={{ margin: 0, color: '#78350F', fontSize: '0.9rem' }}>
          This slot is currently full. Join the waitlist and we'll notify you if a spot becomes available.
        </p>
      </div>

      {success && (
        <div style={{
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyles}>
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
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyles}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: theme.textColor
          }}>
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            style={inputStyles}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            color: theme.textColor
          }}>
            Number of People *
          </label>
          <input
            type="number"
            name="partySize"
            value={formData.partySize}
            onChange={handleChange}
            min="1"
            max="5"
            required
            style={inputStyles}
          />
          <small style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            Maximum 5 people per waitlist entry
          </small>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={buttonStyles}
        >
          {submitting ? 'Adding to Waitlist...' : 'Add to Waitlist'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: 'transparent',
            color: theme.primaryColor,
            padding: '0.5rem 1rem',
            border: `2px solid ${theme.primaryColor}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ← Back to Available Slots
        </button>
      </div>
    </div>
  )
}

export default WaitlistPage

