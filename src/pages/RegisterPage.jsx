import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const RegisterPage = () => {
  const { theme } = useTheme()
  const { register } = useAuth()
  const navigate = useNavigate()

  // Check if user registration is allowed
  if (!theme.allowUserRegistration) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          maxWidth: '500px',
          margin: '2rem auto',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.backgroundColor,
          color: theme.textColor
        }}>
          <h2 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
            Registration Disabled
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            User registration is currently disabled. Please contact an administrator to create an account for you.
          </p>
          <Link 
            to="/login" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor,
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    })
    
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error || 'Registration failed')
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
          Create Admin Account
        </h2>

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
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
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
              Email Address
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
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: theme.textColor
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="Confirm your password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={buttonStyles}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        <Link to="/login" style={linkStyles}>
          Already have an account? Sign In
        </Link>
        <Link to="/" style={linkStyles}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage
