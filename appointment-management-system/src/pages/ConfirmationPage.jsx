import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const ConfirmationPage = () => {
  const { theme } = useTheme()
  const { registrationId } = useParams()
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationDetails()
    }
  }, [registrationId])

  const fetchRegistrationDetails = async () => {
    try {
      // Fetch registration details from API
      const response = await fetch(`/api/registrations/${registrationId}`)
      
      if (!response.ok) {
        throw new Error('Registration not found')
      }
      
      const registrationData = await response.json()
      
      // Fetch QR code
      const qrResponse = await fetch(`/api/registrations/${registrationId}/qr`)
      let qrCode = null
      
      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        qrCode = qrData.qrCode
      }
      
      setRegistration({
        ...registrationData,
        qrCode
      })
    } catch (err) {
      setError('Failed to load registration details')
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

  const containerStyles = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem 1rem'
  }

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }

  const successStyles = {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }

  const qrStyles = {
    maxWidth: '200px',
    height: 'auto',
    margin: '1rem auto',
    border: `2px solid ${theme.primaryColor}`,
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: 'white'
  }

  const detailsStyles = {
    backgroundColor: theme.backgroundColor,
    padding: '1.5rem',
    borderRadius: '8px',
    margin: '1.5rem 0',
    textAlign: 'left'
  }

  const buttonStyles = {
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '0.5rem'
  }

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
            Loading confirmation details...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: '#EF4444', fontSize: '1.2rem' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <div style={successStyles}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            Registration Confirmed!
          </span>
        </div>

        <h2 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
          Your Appointment Details
        </h2>

        <div style={detailsStyles}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              Appointment Information
            </h4>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              <div><strong>Date:</strong> {formatDate(registration.timeslot.date)}</div>
              <div><strong>Time:</strong> {registration.timeslot.start} - {registration.timeslot.end}</div>
              <div><strong>Party Size:</strong> {registration.partySize} {registration.partySize === 1 ? 'person' : 'people'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              Contact Information
            </h4>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              <div><strong>Name:</strong> {registration.fullName}</div>
              <div><strong>Email:</strong> {registration.email}</div>
              <div><strong>Phone:</strong> {registration.phone}</div>
            </div>
          </div>

          <div>
            <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              Registration ID
            </h4>
            <div style={{ 
              fontFamily: 'monospace', 
              backgroundColor: '#F3F4F6', 
              padding: '0.5rem', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {registration.id}
            </div>
          </div>
        </div>

        <div style={{ margin: '2rem 0' }}>
          <h4 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Check-in QR Code
          </h4>
          {registration.qrCode ? (
            <img 
              src={registration.qrCode} 
              alt="QR Code for check-in" 
              style={qrStyles}
            />
          ) : (
            <div style={{
              ...qrStyles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              backgroundColor: '#F3F4F6',
              color: theme.textColor
            }}>
              QR Code will be generated
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: theme.textColor, marginTop: '1rem' }}>
            Present this QR code at the entrance for easy check-in
          </p>
        </div>

        <div style={{ margin: '2rem 0', padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
          <h4 style={{ color: '#92400E', marginBottom: '0.5rem' }}>
            Important Instructions
          </h4>
          <ul style={{ color: '#92400E', fontSize: '0.9rem', lineHeight: '1.5', textAlign: 'left' }}>
            <li>Please arrive 10 minutes before your scheduled time</li>
            <li>Bring a valid ID matching the primary attendee's name</li>
            <li>Present the QR code or provide your name/phone for check-in</li>
            <li>Confirmation email and SMS have been sent to your contact information</li>
          </ul>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <a href="/" style={buttonStyles}>
            ← Back to Home
          </a>
          <button 
            style={{...buttonStyles, backgroundColor: theme.secondaryColor}}
            onClick={() => window.print()}
          >
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPage