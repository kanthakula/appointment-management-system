import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const BookingsManagement = () => {
  console.log('BookingsManagement component loaded')
  const { theme } = useTheme()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState('all') // 'all', 'name', 'email', 'phone'
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'checked-in', 'not-checked-in'

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [searchTerm, searchField, dateFilter, statusFilter])

  const fetchBookings = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
        params.append('searchField', searchField)
      }
      if (dateFilter) {
        params.append('date', dateFilter)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const bookingsData = await response.json()
        setBookings(bookingsData)
      } else {
        setError('Failed to load bookings')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }


  const handleCheckInToggle = async (bookingId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/checkin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ checkedIn: !currentStatus }),
      })

      if (response.ok) {
        fetchBookings() // Refresh the bookings list
      } else {
        setError('Failed to update check-in status')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString || 'N/A'
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1rem'
  }

  const buttonStyles = {
    backgroundColor: theme.secondaryColor,
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    margin: '0.25rem'
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

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
  }

  const thStyles = {
    backgroundColor: theme.backgroundColor,
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: `2px solid ${theme.primaryColor}`,
    fontWeight: 'bold'
  }

  const tdStyles = {
    padding: '0.75rem',
    borderBottom: '1px solid #E5E7EB'
  }

  if (loading) {
    return (
      <div style={cardStyles}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
            Loading bookings...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={cardStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: theme.primaryColor, margin: 0 }}>
            Bookings Management
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={fetchBookings}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#059669'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#10B981'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              🔄 Refresh Data
            </button>
            <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 'bold' }}>
              ✅ Search & Filter Enabled
            </div>
          </div>
        </div>

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

        {/* Search and Filter Controls */}
        <div style={{ 
          backgroundColor: '#F9FAFB', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          border: `1px solid #E5E7EB`
        }}>
          <h4 style={{ color: theme.primaryColor, marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Search & Filter
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Search Input */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor,
                fontSize: '0.9rem'
              }}>
                Search Term
              </label>
              <input
                type="text"
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyles}
              />
            </div>

            {/* Search Field Selection */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor,
                fontSize: '0.9rem'
              }}>
                Search In
              </label>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                style={{
                  ...inputStyles,
                  marginBottom: '0'
                }}
              >
                <option value="all">All Fields</option>
                <option value="name">Name Only</option>
                <option value="email">Email Only</option>
                <option value="phone">Phone Only</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor,
                fontSize: '0.9rem'
              }}>
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={inputStyles}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor,
                fontSize: '0.9rem'
              }}>
                Check-in Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  ...inputStyles,
                  marginBottom: '0'
                }}
              >
                <option value="all">All Bookings</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              onClick={() => {
                setSearchTerm('')
                setSearchField('all')
                setDateFilter('')
                setStatusFilter('all')
              }}
              style={{
                backgroundColor: '#6B7280',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {bookings.length > 0 && (
          <div style={{
            backgroundColor: '#F3F4F6',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: theme.textColor
          }}>
            <strong>Showing {bookings.length} bookings</strong>
            {(searchTerm || dateFilter || statusFilter !== 'all') && (
              <span> - Filtered results</span>
            )}
          </div>
        )}

        {/* Bookings Table */}
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Visitor</th>
              <th style={thStyles}>Contact</th>
              <th style={thStyles}>Event Date & Time</th>
              <th style={thStyles}>Party Size</th>
              <th style={thStyles}>Booking Date</th>
              <th style={thStyles}>Status</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td style={tdStyles}>
                  <div style={{ fontWeight: 'bold' }}>
                    {booking.fullName}
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div>{booking.email}</div>
                    <div style={{ color: '#6B7280' }}>{booking.phone}</div>
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatDate(booking.timeslot.date)}
                    </div>
                    <div style={{ color: '#6B7280' }}>
                      {formatTime(booking.timeslot.start)}
                      {booking.timeslot.end && ` - ${formatTime(booking.timeslot.end)}`}
                    </div>
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{booking.partySize}</strong> people
                    {booking.actualCheckInCount && booking.actualCheckInCount !== booking.partySize && (
                      <div style={{ fontSize: '0.8rem', color: '#10B981' }}>
                        (Actually: {booking.actualCheckInCount})
                      </div>
                    )}
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    {formatDateTime(booking.createdAt)}
                  </div>
                </td>
                <td style={tdStyles}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: booking.checkedIn ? '#D1FAE5' : '#FEE2E2',
                    color: booking.checkedIn ? '#065F46' : '#DC2626'
                  }}>
                    {booking.checkedIn ? 'Checked In' : 'Not Checked In'}
                  </span>
                </td>
                <td style={tdStyles}>
                  <button 
                    style={{
                      backgroundColor: booking.checkedIn ? '#EF4444' : '#10B981',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      margin: '0.25rem'
                    }}
                    onClick={() => handleCheckInToggle(booking.id, booking.checkedIn)}
                  >
                    {booking.checkedIn ? 'Mark Not Checked In' : 'Mark Checked In'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
            No bookings found.
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingsManagement
