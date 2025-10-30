import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const { theme } = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error || 'Login failed')
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
          Admin Login
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
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyles}
              placeholder="admin@example.com"
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

          <button 
            type="submit" 
            disabled={loading}
            style={buttonStyles}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        
        <Link to="/" style={linkStyles}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
