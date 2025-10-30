import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const CheckInPage = () => {
  const { theme } = useTheme()
  const [checkInMethod, setCheckInMethod] = useState('qr') // 'qr' or 'search'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [foundRegistration, setFoundRegistration] = useState(null)
  const [actualCheckInCount, setActualCheckInCount] = useState(1)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const handleQRScan = async (qrData) => {
    setLoading(true)
    setError('')
    
    try {
      // Parse QR code data (assuming it contains registration ID)
      let registrationId
      try {
        const parsedData = JSON.parse(qrData)
        registrationId = parsedData.registrationId || parsedData.id
      } catch {
        // If not JSON, assume the entire string is the registration ID
        registrationId = qrData
      }

      if (!registrationId) {
        setError('Invalid QR code format')
        setLoading(false)
        return
      }

      // Get registration details
      const response = await fetch('/api/registrations/' + registrationId)
      
      if (response.ok) {
        const reg = await response.json()
        
        // Check if already checked in
        if (reg.checkedIn) {
          setError('This registration has already been checked in')
          setLoading(false)
          return
        }

        // Check if registration is for past date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (reg.timeslot && reg.timeslot.date < today) {
          setError('This registration is for a past event')
          setLoading(false)
          return
        }

        // Set found registration for two-step process
        setFoundRegistration({
          id: reg.id,
          name: reg.fullName,
          email: reg.email,
          phone: reg.phone,
          partySize: reg.partySize,
          date: reg.timeslot?.date,
          start: reg.timeslot?.start,
          end: reg.timeslot?.end
        })
        setActualCheckInCount(reg.partySize)
        
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Registration not found')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/checkin/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: searchQuery.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setFoundRegistration(data.reg)
        setActualCheckInCount(data.reg.partySize) // Default to party size
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'No registration found')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCheckIn = async () => {
    if (!foundRegistration) return
    
    // Double-check validation before sending request
    if (actualCheckInCount < 1 || actualCheckInCount > foundRegistration.partySize) {
      setError(`Cannot check in ${actualCheckInCount} people. Maximum allowed: ${foundRegistration.partySize} people (original booking)`)
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/checkin/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          registrationId: foundRegistration.id,
          actualCheckInCount: parseInt(actualCheckInCount)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setFoundRegistration(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Check-in failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const resetCheckIn = () => {
    setResult(null)
    setError('')
    setSearchQuery('')
    setFoundRegistration(null)
    setActualCheckInCount(1)
    setIsScanning(false)
    setCameraError('')
  }

  const startQRScanner = async () => {
    setIsScanning(true)
    setError('')
    setCameraError('')
    
    try {
      // Load the QR scanner library dynamically
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      
      // Clear any existing scanner content
      const scannerElement = document.getElementById('qr-scanner')
      if (scannerElement) {
        scannerElement.innerHTML = ''
      }
      
      const scanner = new Html5QrcodeScanner(
        "qr-scanner",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          rememberLastUsedCamera: true
        },
        false
      )
      
      scanner.render(
        (decodedText) => {
          console.log('QR Code detected:', decodedText)
          handleQRScan(decodedText)
          scanner.clear()
          setIsScanning(false)
        },
        (error) => {
          // Only log errors that aren't "No QR code found"
          if (!error.includes('No QR code found') && !error.includes('NotFoundException')) {
            console.log('QR scan error:', error)
          }
        }
      )
      
    } catch (error) {
      console.error('Failed to start QR scanner:', error)
      setCameraError('Failed to start camera. Please ensure camera permissions are granted and try again.')
      setIsScanning(false)
    }
  }

  const stopQRScanner = () => {
    setIsScanning(false)
    setCameraError('')
    
    // Clear the scanner element
    const scannerElement = document.getElementById('qr-scanner')
    if (scannerElement) {
      scannerElement.innerHTML = ''
    }
  }

  const containerStyles = {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '1rem'
  }

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '1rem'
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
    width: '100%',
    margin: '0.5rem 0'
  }

  const inputStyles = {
    width: '100%',
    padding: '0.75rem',
    border: `2px solid #E5E7EB`,
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  }

  const successStyles = {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '1rem 0'
  }

  const errorStyles = {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '1rem 0'
  }

  const scannerStyles = {
    width: '100%',
    height: '300px',
    backgroundColor: '#000',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.1rem',
    marginBottom: '1rem'
  }

  return (
    <div style={containerStyles}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
          Check-In Station
        </h2>
        <p style={{ color: theme.textColor }}>
          Scan QR code or search by name/phone to check in
        </p>
      </div>

      {!result && !foundRegistration ? (
        <>
          {/* Method Selection */}
          <div style={cardStyles}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                style={{
                  ...buttonStyles,
                  backgroundColor: checkInMethod === 'qr' ? theme.primaryColor : '#E5E7EB',
                  color: checkInMethod === 'qr' ? 'white' : theme.textColor,
                  margin: 0,
                  flex: 1
                }}
                onClick={() => setCheckInMethod('qr')}
              >
                QR Scan
              </button>
              <button
                style={{
                  ...buttonStyles,
                  backgroundColor: checkInMethod === 'search' ? theme.primaryColor : '#E5E7EB',
                  color: checkInMethod === 'search' ? 'white' : theme.textColor,
                  margin: 0,
                  flex: 1
                }}
                onClick={() => setCheckInMethod('search')}
              >
                Manual Search
              </button>
            </div>

            {checkInMethod === 'qr' ? (
              <div>
                <div id="qr-scanner" style={{ 
                  marginBottom: '1rem',
                  minHeight: '250px',
                  border: '2px dashed #E5E7EB',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F9FAFB'
                }}>
                  {!isScanning && (
                    <div style={{ textAlign: 'center', color: '#6B7280' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                      <div>Camera will appear here when scanner starts</div>
                    </div>
                  )}
                </div>
                
                {cameraError && (
                  <div style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}>
                    {cameraError}
                  </div>
                )}
                
                {!isScanning && (
                  <div>
                    <button
                      style={buttonStyles}
                      onClick={startQRScanner}
                      disabled={loading}
                    >
                      {loading ? 'Starting Camera...' : 'Start QR Scanner'}
                    </button>
                    
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#F0F9FF',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: '#0369A1', marginBottom: '0.5rem' }}>
                        <strong>Alternative:</strong> Use Manual Search instead
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                        If camera doesn't work, switch to "Manual Search" and enter the registration ID directly
                      </div>
                      <button
                        style={{
                          ...buttonStyles,
                          backgroundColor: '#10B981',
                          marginTop: '0.5rem',
                          fontSize: '0.9rem',
                          padding: '0.5rem 1rem'
                        }}
                        onClick={() => setCheckInMethod('search')}
                      >
                        Switch to Manual Search
                      </button>
                    </div>
                  </div>
                )}
                
                {isScanning && (
                  <div>
                    <div style={{
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      fontSize: '0.9rem'
                    }}>
                      📹 Camera active - Point at QR code to scan
                    </div>
                    <button
                      style={{
                        ...buttonStyles,
                        backgroundColor: '#EF4444'
                      }}
                      onClick={stopQRScanner}
                    >
                      Stop Scanner
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter name, email, or phone number"
                    style={inputStyles}
                    required
                  />
                  <button
                    type="submit"
                    style={buttonStyles}
                    disabled={loading || !searchQuery.trim()}
                  >
                    {loading ? 'Searching...' : 'Search Registration'}
                  </button>
                </form>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '8px',
                  border: '1px solid #BBF7D0'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.5rem' }}>
                    <strong>Test Registration:</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    Name: John Doe | Email: john@example.com | Phone: 5551234567
                  </div>
                  <button
                    style={{
                      ...buttonStyles,
                      backgroundColor: '#10B981',
                      fontSize: '0.9rem',
                      padding: '0.5rem 1rem'
                    }}
                    onClick={() => setSearchQuery('john@example.com')}
                  >
                    Use Test Registration
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={errorStyles}>
              {error}
            </div>
          )}
        </>
      ) : foundRegistration ? (
        /* Registration Found - Show Details and Check-in Count */
        <div style={cardStyles}>
          <div style={{ 
            backgroundColor: '#EFF6FF', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #3B82F6'
          }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              📋 Registration Found
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div><strong>Name:</strong> {foundRegistration.name}</div>
              <div><strong>Email:</strong> {foundRegistration.email}</div>
              <div><strong>Phone:</strong> {foundRegistration.phone}</div>
              <div><strong>Date:</strong> {foundRegistration.date ? new Date(foundRegistration.date).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Time:</strong> {foundRegistration.start ? `${foundRegistration.start}${foundRegistration.end ? ` - ${foundRegistration.end}` : ''}` : 'N/A'}</div>
              <div><strong>Party Size:</strong> {foundRegistration.partySize} people</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Number of people checking in:
            </label>
            <input
              type="number"
              min="1"
              max={foundRegistration.partySize}
              value={actualCheckInCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                // Enforce maximum limit
                const maxAllowed = foundRegistration.partySize;
                const clampedValue = Math.min(Math.max(value, 1), maxAllowed);
                setActualCheckInCount(clampedValue);
              }}
              style={{
                ...inputStyles,
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
              Maximum: {foundRegistration.partySize} people (original booking)
            </div>
            {actualCheckInCount > foundRegistration.partySize && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#DC2626', 
                backgroundColor: '#FEE2E2',
                padding: '0.5rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                ⚠️ Cannot check in more than {foundRegistration.partySize} people (original booking limit)
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                ...buttonStyles,
                backgroundColor: '#EF4444',
                flex: 1
              }}
              onClick={resetCheckIn}
            >
              Cancel
            </button>
            <button
              style={{
                ...buttonStyles,
                backgroundColor: '#10B981',
                flex: 2
              }}
              onClick={handleConfirmCheckIn}
              disabled={loading || actualCheckInCount < 1 || actualCheckInCount > foundRegistration.partySize || !foundRegistration}
            >
              {loading ? 'Checking In...' : `Check-in ${actualCheckInCount} ${actualCheckInCount === 1 ? 'Person' : 'People'}`}
            </button>
          </div>

          {error && (
            <div style={errorStyles}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={cardStyles}>
          <div style={successStyles}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Check-in Successful!
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {result.reg.name} has been checked in ({result.reg.actualCheckInCount}/{result.reg.partySize} people)
            </div>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
              Registration Details:
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div><strong>Name:</strong> {result.reg.name}</div>
              <div><strong>Phone:</strong> {result.reg.phone}</div>
              <div><strong>Date:</strong> {result.reg.date ? new Date(result.reg.date).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Time:</strong> {result.reg.start || 'N/A'}</div>
              <div><strong>Party Size:</strong> {result.reg.partySize || 1}</div>
            </div>
          </div>

          <button
            style={buttonStyles}
            onClick={resetCheckIn}
          >
            Check-in Another Person
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <a 
          href="/" 
          style={{ 
            color: theme.primaryColor, 
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}

export default CheckInPage