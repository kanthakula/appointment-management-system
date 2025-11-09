import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Stack,
  Divider
} from '@mui/material'
import { AccountCircle, Logout, PhotoCamera } from '@mui/icons-material'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const { theme } = useTheme()
  const { isAuthenticated, isAdmin, logout, user } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('profilePic', file)

    try {
      const response = await fetch('/api/user/profile-pic', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        handleMenuClose()
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert('Failed to upload profile picture: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to upload profile picture: Network error')
    }
  }

  const handleLogout = () => {
    handleMenuClose()
    window.location.replace('/logout')
  }

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: theme.primaryColor,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', color: 'inherit' }}>
          {theme.logo && (
            <Box
              component="img"
              src={theme.logo}
              alt={`${theme.organizationName} Logo`}
              sx={{ height: 40, width: 'auto' }}
            />
          )}
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
            {theme.organizationName}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button 
            component={Link} 
            to="/" 
            color="inherit"
            sx={{ 
              border: '1px solid rgba(255,255,255,0.5)',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Home
          </Button>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button 
                  component={Link} 
                  to="/admin" 
                  color="inherit"
                  sx={{ 
                    border: '1px solid rgba(255,255,255,0.5)',
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Admin Dashboard
                </Button>
              )}
              <Button 
                component={Link} 
                to="/checkin" 
                color="inherit"
                sx={{ 
                  border: '1px solid rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Check-In
              </Button>

              <Button
                onClick={handleLogout}
                sx={{
                  backgroundColor: '#DC2626',
                  color: 'white',
                  '&:hover': { backgroundColor: '#B91C1C' }
                }}
                startIcon={<Logout />}
              >
                Logout
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handleProfileClick}
                  sx={{ p: 0 }}
                >
                  <Avatar
                    src={user?.profilePic}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {user?.profilePic 
                      ? null 
                      : (user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U')
                    }
                  </Avatar>
                </IconButton>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                    {user?.name || 'Admin User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                    {user?.roles && user.roles.length > 0 
                      ? user.roles.map(role => role.replace('_', ' ').toUpperCase()).join(', ')
                      : user?.role?.replace('_', ' ').toUpperCase()
                    }
                  </Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: { minWidth: 200, mt: 1 }
                }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.name || 'Admin User'}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem component="label">
                  <PhotoCamera sx={{ mr: 1, fontSize: 20 }} />
                  Change Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfilePictureUpload}
                  />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1, fontSize: 20 }} />
                  Logout
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Typography variant="caption">Emergency Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              component={Link} 
              to="/login" 
              color="inherit"
              sx={{ 
                border: '1px solid rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Login
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Header
