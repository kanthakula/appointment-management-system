import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const { theme } = useTheme()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileUpload, setShowProfileUpload] = useState(false)
  const profileRef = useRef(null)

  const headerStyles = {
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    textDecoration: 'none',
    color: 'white'
  }

  const navStyles = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  }

  const buttonStyles = {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }

  const profileStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1001
  }

  const profilePicStyles = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    border: '2px solid white'
  }

  const profileMenuStyles = {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '200px',
    zIndex: 1002,
    marginTop: '0'
  }

  const profileMenuItemStyles = {
    padding: '0.75rem 1rem',
    color: '#333',
    textDecoration: 'none',
    display: 'block',
    borderBottom: '1px solid #eee',
    cursor: 'pointer'
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('profilePic', file)

    try {
      console.log('Uploading profile picture...')
      const response = await fetch('/api/user/profile-pic', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Profile picture uploaded successfully:', result)
        // Close the profile menu
        setShowProfileMenu(false)
        // Reload to show updated profile picture
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('Profile picture upload failed:', errorData.error)
        alert('Failed to upload profile picture: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error)
      alert('Failed to upload profile picture: Network error')
    }
  }

  const handleLogout = () => {
    console.log('Logout button clicked')
    setShowProfileMenu(false)
    // Use the working logout URL directly
    window.location.href = '/logout'
  }

  const handleEmergencyLogout = () => {
    console.log('Emergency logout triggered')
    setShowProfileMenu(false)
    // Use the working logout URL directly
    window.location.href = '/logout'
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  return (
    <header style={headerStyles}>
      <Link to="/" style={logoStyles}>
        {theme.logo && (
          <img 
            src={theme.logo} 
            alt={`${theme.organizationName} Logo`}
            style={{ height: '40px', width: 'auto' }}
          />
        )}
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          {theme.organizationName}
        </h1>
      </Link>
      
      <nav style={navStyles}>
        <Link to="/" style={buttonStyles}>
          Home
        </Link>
        
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link to="/admin" style={buttonStyles}>
                Admin Dashboard
              </Link>
            )}
            <Link to="/checkin" style={buttonStyles}>
              Check-In
            </Link>
            
            {/* Direct Logout Button */}
            <button 
              onClick={() => window.location.href = '/logout'}
              style={{
                ...buttonStyles,
                backgroundColor: '#DC2626',
                borderColor: '#DC2626',
                cursor: 'pointer'
              }}
            >
              🚪 Logout
            </button>
            
            {/* User Profile Section with Menu */}
            <div style={{ position: 'relative' }}>
              <div 
                ref={profileRef}
                style={profileStyles}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div style={profilePicStyles}>
                  {user?.profilePic ? (
                    <img 
                      src={user.profilePic} 
                      alt="Profile" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {user?.name || 'Admin User'}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {user?.roles && user.roles.length > 0 
                      ? user.roles.map(role => role.replace('_', ' ').toUpperCase()).join(', ')
                      : user?.role?.replace('_', ' ').toUpperCase()
                    }
                  </div>
                </div>
              </div>

              {/* Profile Menu */}
              {showProfileMenu && (
                <div style={profileMenuStyles}>
                  <div style={{ ...profileMenuItemStyles, borderBottom: 'none', fontWeight: 'bold' }}>
                    {user?.name || 'Admin User'}
                  </div>
                  <div style={{ ...profileMenuItemStyles, borderBottom: 'none', fontSize: '0.8rem', color: '#666' }}>
                    {user?.email}
                  </div>
                  <div style={{ borderTop: '1px solid #eee', margin: '0.5rem 0' }}></div>
                  <label style={profileMenuItemStyles} onClick={() => setShowProfileUpload(true)}>
                    📷 Change Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfilePictureUpload}
                    />
                  </label>
                  <button 
                    onClick={handleLogout}
                    style={{ ...profileMenuItemStyles, width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
                  >
                    🚪 Logout
                  </button>
                  <button 
                    onClick={handleEmergencyLogout}
                    style={{ ...profileMenuItemStyles, width: '100%', textAlign: 'left', border: 'none', background: 'none', color: '#DC2626', fontSize: '0.8rem' }}
                  >
                    🔴 Emergency Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" style={buttonStyles}>
            Login
          </Link>
        )}
      </nav>
    </header>
  )
}

export default Header
