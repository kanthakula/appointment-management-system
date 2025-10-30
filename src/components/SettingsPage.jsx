import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const SettingsPage = () => {
  const { theme, updateTheme } = useTheme()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    organizationName: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    backgroundColor: '',
    textColor: '',
    timezone: '',
    emailWhitelist: '',
    allowUserRegistration: true,
    maxAttendees: 5
  })
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    // Initialize form with current theme
    setFormData({
      organizationName: theme.organizationName || '',
      primaryColor: theme.primaryColor || '',
      secondaryColor: theme.secondaryColor || '',
      accentColor: theme.accentColor || '',
      backgroundColor: theme.backgroundColor || '',
      textColor: theme.textColor || '',
      timezone: theme.timezone || '',
      emailWhitelist: theme.emailWhitelist || '',
      allowUserRegistration: theme.allowUserRegistration !== undefined ? theme.allowUserRegistration : true,
      maxAttendees: theme.maxAttendees !== undefined ? theme.maxAttendees : 5
    })
    setLogoPreview(theme.logo)
  }, [theme])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLogoLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('logo', file)

    try {
      const response = await fetch('/api/config/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setLogoPreview(result.logo)
        setSuccess('Logo uploaded successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to upload logo')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLogoLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const success = await updateTheme(formData)
      if (success) {
        setSuccess('Settings updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to update settings')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    setFormData({
      organizationName: 'DarshanFlow',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      timezone: 'America/Chicago',
      emailWhitelist: '',
      allowUserRegistration: true,
      maxAttendees: 5
    })
  }

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1rem'
  }

  const inputStyles = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  }

  const colorInputStyles = {
    ...inputStyles,
    width: '60px',
    height: '40px',
    padding: '0.25rem',
    marginBottom: '0.5rem'
  }

  const buttonStyles = {
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: '0.5rem'
  }

  const resetButtonStyles = {
    backgroundColor: '#6B7280',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }

  const timezones = [
    'America/Chicago',
    'America/New_York',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: theme.primaryColor, marginBottom: '2rem' }}>
        Organization Settings
      </h2>

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

      <form onSubmit={handleSubmit}>
        {/* Organization Info */}
        <div style={cardStyles}>
          <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Organization Information
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Organization Logo
            </label>
            {logoPreview && (
              <div style={{ marginBottom: '1rem' }}>
                <img 
                  src={logoPreview} 
                  alt="Current logo" 
                  style={{ 
                    maxHeight: '100px', 
                    maxWidth: '200px',
                    border: `2px solid ${theme.primaryColor}`,
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={logoLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `2px solid #E5E7EB`,
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '0.5rem',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: '#6B7280', fontSize: '0.9rem' }}>
              Upload a logo image (JPG, PNG, GIF - max 5MB)
            </small>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Organization Name
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="e.g., Grace Temple, Community Center"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              required
              style={inputStyles}
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Email Whitelist (comma-separated domains)
            </label>
            <input
              type="text"
              name="emailWhitelist"
              value={formData.emailWhitelist}
              onChange={handleChange}
              style={inputStyles}
              placeholder="example.com, gmail.com (leave empty to allow all)"
            />
            <small style={{ color: '#6B7280', fontSize: '0.9rem' }}>
              Only allow registrations from these email domains. Leave empty to allow all domains.
            </small>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Maximum Attendees per Booking
            </label>
            <input
              type="number"
              name="maxAttendees"
              value={formData.maxAttendees}
              onChange={handleChange}
              min="1"
              max="100"
              required
              style={inputStyles}
              placeholder="5"
            />
            <small style={{ color: '#6B7280', fontSize: '0.9rem' }}>
              Maximum number of people that can be booked in a single reservation. This will be enforced during the booking process.
            </small>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                name="allowUserRegistration"
                checked={formData.allowUserRegistration}
                onChange={handleChange}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: theme.primaryColor
                }}
              />
              <span style={{ 
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Allow End Users to Create Accounts
              </span>
            </label>
            <small style={{ 
              color: '#6B7280', 
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              display: 'block'
            }}>
              When enabled, visitors can create their own accounts when making reservations. When disabled, only admins can create user accounts.
            </small>
          </div>
        </div>

        {/* Theme Colors */}
        <div style={cardStyles}>
          <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Theme Colors
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Primary Color
              </label>
              <input
                type="color"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                style={colorInputStyles}
              />
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                {formData.primaryColor}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Secondary Color
              </label>
              <input
                type="color"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                style={colorInputStyles}
              />
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                {formData.secondaryColor}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Accent Color
              </label>
              <input
                type="color"
                name="accentColor"
                value={formData.accentColor}
                onChange={handleChange}
                style={colorInputStyles}
              />
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                {formData.accentColor}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Background Color
              </label>
              <input
                type="color"
                name="backgroundColor"
                value={formData.backgroundColor}
                onChange={handleChange}
                style={colorInputStyles}
              />
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                {formData.backgroundColor}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor
              }}>
                Text Color
              </label>
              <input
                type="color"
                name="textColor"
                value={formData.textColor}
                onChange={handleChange}
                style={colorInputStyles}
              />
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                {formData.textColor}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={cardStyles}>
          <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Theme Preview
          </h3>
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: formData.backgroundColor,
            color: formData.textColor,
            border: `2px solid ${formData.primaryColor}`
          }}>
            <div style={{
              backgroundColor: formData.primaryColor,
              color: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {formData.organizationName} - Header Preview
            </div>
            <div style={{
              backgroundColor: formData.secondaryColor,
              color: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Secondary Button Preview
            </div>
            <div style={{
              backgroundColor: formData.accentColor,
              color: 'white',
              padding: '0.5rem',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              Accent Element Preview
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...buttonStyles,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          <button 
            type="button"
            onClick={resetToDefaults}
            style={resetButtonStyles}
          >
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
