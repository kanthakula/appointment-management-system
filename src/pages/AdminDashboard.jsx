import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import SettingsPage from '../components/SettingsPage'
import TimeslotManagement from '../components/TimeslotManagement'
import BookingsManagement from '../components/BookingsManagement'
import ArchivedSlotsManagement from '../components/ArchivedSlotsManagement'
import AdminUserManagement from '../components/AdminUserManagement'
import AuditLogs from '../components/AuditLogs'

const AdminDashboard = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  
  const [activeTab, setActiveTab] = useState('overview')
  const [timeslots, setTimeslots] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalSlots: 0,
    publishedSlots: 0,
    totalBookings: 0,
    totalCheckIns: 0,
    totalCheckedInCapacity: 0,
    totalWaitlistEntries: 0,
    totalWaitlistPeople: 0
  })
  const [recentActivity, setRecentActivity] = useState({
    recentBookings: [],
    recentCheckIns: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab !== 'overview') {
      setRefreshing(true)
      fetchData().finally(() => setRefreshing(false))
    }
  }, [activeTab])

  const fetchData = async (timeslotFilters = {}) => {
    try {
      // Build query string for timeslots API
      const timeslotParams = new URLSearchParams()
      if (timeslotFilters.archived !== undefined) {
        timeslotParams.append('archived', timeslotFilters.archived)
      }
      if (timeslotFilters.archivedBy) {
        timeslotParams.append('archivedBy', timeslotFilters.archivedBy)
      }
      
      const timeslotUrl = `/api/admin/timeslots${timeslotParams.toString() ? '?' + timeslotParams.toString() : ''}`
      
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}`
      const timeslotUrlWithCache = timeslotUrl.includes('?') 
        ? `${timeslotUrl}&${cacheBuster}` 
        : `${timeslotUrl}?${cacheBuster}`
      
      const [timeslotsRes, statsRes, activityRes] = await Promise.all([
        fetch(timeslotUrlWithCache, { credentials: 'include' }),
        fetch(`/api/admin/stats?${cacheBuster}`, { credentials: 'include' }),
        fetch(`/api/admin/recent-activity?${cacheBuster}`, { credentials: 'include' })
      ])
      
      if (timeslotsRes.ok) {
        const slots = await timeslotsRes.json()
        setTimeslots(slots)
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
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

  const tabStyles = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: `2px solid ${theme.backgroundColor}`
  }

  const tabButtonStyles = (isActive) => ({
    padding: '0.75rem 1.5rem',
    backgroundColor: isActive ? theme.primaryColor : 'transparent',
    color: isActive ? 'white' : theme.textColor,
    border: 'none',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  })

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1rem'
  }

  const statCardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    flex: 1
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

  const dangerButtonStyles = {
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    margin: '0.25rem'
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
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: theme.primaryColor, marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h2>
        <p style={{ color: theme.textColor }}>
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div 
          style={{
            ...statCardStyles,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: `2px solid transparent`
          }}
          onClick={() => setActiveTab('timeslots')}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)'
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
            e.target.style.borderColor = theme.primaryColor
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            e.target.style.borderColor = 'transparent'
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.primaryColor }}>
            {stats.totalSlots}
          </div>
          <div style={{ color: theme.textColor }}>Total Slots</div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>Click to view →</div>
        </div>
                <div
                  style={{
                    ...statCardStyles,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid transparent`
                  }}
                  onClick={() => {
                    setActiveTab('timeslots')
                    // Set filter to show only published slots
                    const event = new CustomEvent('filterTimeslots', { detail: { filter: 'published' } })
                    window.dispatchEvent(event)
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    e.target.style.borderColor = theme.secondaryColor
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.secondaryColor }}>
                    {stats.publishedSlots}
                  </div>
                  <div style={{ color: theme.textColor }}>Published</div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>Click to view published →</div>
                </div>
                <div
                  style={{
                    ...statCardStyles,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid transparent`
                  }}
                  onClick={() => {
                    setActiveTab('bookings')
                    // Set filter to show all bookings by default
                    const event = new CustomEvent('filterBookings', { detail: { filter: 'all' } })
                    window.dispatchEvent(event)
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    e.target.style.borderColor = theme.accentColor
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.accentColor }}>
                    {stats.totalBookings}
                  </div>
                  <div style={{ color: theme.textColor }}>Total Bookings</div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>Click to view all →</div>
                </div>
                <div
                  style={{
                    ...statCardStyles,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid transparent`
                  }}
                  onClick={() => {
                    setActiveTab('bookings')
                    // Set filter to show only checked-in bookings
                    const event = new CustomEvent('filterBookings', { detail: { filter: 'checked-in' } })
                    window.dispatchEvent(event)
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    e.target.style.borderColor = '#10B981'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
                    {stats.totalCheckIns}
                  </div>
                  <div style={{ color: theme.textColor }}>Check-ins</div>
                  <div style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 'bold', marginTop: '0.25rem' }}>
                    ({stats.totalCheckedInCapacity} people)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>Click to filter →</div>
                </div>
                <div
                  style={{
                    ...statCardStyles,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid transparent`
                  }}
                  onClick={() => {
                    setActiveTab('timeslots')
                    // Set filter to show only slots with waitlist entries
                    const event = new CustomEvent('filterTimeslots', { detail: { filter: 'waitlist' } })
                    window.dispatchEvent(event)
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)'
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    e.target.style.borderColor = '#DC2626'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DC2626' }}>
                    {stats.totalWaitlistEntries}
                  </div>
                  <div style={{ color: theme.textColor }}>Waitlist Entries</div>
                  <div style={{ fontSize: '0.9rem', color: '#DC2626', fontWeight: 'bold', marginTop: '0.25rem' }}>
                    ({stats.totalWaitlistPeople} people)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.5rem' }}>Click to view →</div>
                </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ ...tabStyles, position: 'relative' }}>
        {refreshing && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '10px',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 10,
            animation: 'pulse 1.5s infinite'
          }}>
            🔄 Refreshing...
          </div>
        )}
        <button 
          style={tabButtonStyles(activeTab === 'overview')}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          style={tabButtonStyles(activeTab === 'timeslots')}
          onClick={() => setActiveTab('timeslots')}
        >
          Time Slots
        </button>
        <button 
          style={tabButtonStyles(activeTab === 'bookings')}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          style={tabButtonStyles(activeTab === 'audit-logs')}
          onClick={() => setActiveTab('audit-logs')}
        >
          Audit Logs
        </button>
        <button
          style={tabButtonStyles(activeTab === 'archived')}
          onClick={() => setActiveTab('archived')}
        >
          Archived Slots
        </button>
        <button
          style={tabButtonStyles(activeTab === 'admin-users')}
          onClick={() => setActiveTab('admin-users')}
        >
          Admin Users Management
        </button>
        <button 
          style={tabButtonStyles(activeTab === 'settings')}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div style={cardStyles}>
            <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>Overview</h3>
            <p>Welcome to your DarshanFlow Admin Dashboard. Use the tabs above to manage your time slots, bookings, and settings.</p>
          </div>

          {/* Recent Activity Section */}
          <div style={cardStyles}>
            <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>Recent Activity</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: theme.primaryColor }}>
                Loading recent activity...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Recent Bookings */}
                <div>
                  <h4 style={{ color: theme.secondaryColor, marginBottom: '1rem', fontSize: '1.1rem' }}>
                    Recent Bookings
                  </h4>
                  {recentActivity.recentBookings.length === 0 ? (
                    <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No recent bookings</p>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recentActivity.recentBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: theme.textColor, marginBottom: '0.25rem' }}>
                                {booking.fullName}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                                {booking.email}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                Party of {booking.partySize} • {new Date(booking.createdAt).toLocaleDateString()}
                              </div>
                              {booking.timeslot && (
                                <div style={{ fontSize: '0.8rem', color: theme.primaryColor, marginTop: '0.25rem' }}>
                                  {formatDate(booking.timeslot.date)} at {booking.timeslot.start}
                                </div>
                              )}
                            </div>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              backgroundColor: booking.checkedIn ? '#D1FAE5' : '#FEE2E2',
                              color: booking.checkedIn ? '#065F46' : '#DC2626'
                            }}>
                              {booking.checkedIn ? 'Checked In' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Check-ins */}
                <div>
                  <h4 style={{ color: '#10B981', marginBottom: '1rem', fontSize: '1.1rem' }}>
                    Recent Check-ins
                  </h4>
                  {recentActivity.recentCheckIns.length === 0 ? (
                    <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No recent check-ins</p>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recentActivity.recentCheckIns.slice(0, 5).map((checkIn) => (
                        <div key={checkIn.id} style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          backgroundColor: '#F0FDF4',
                          borderRadius: '6px',
                          border: '1px solid #BBF7D0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: theme.textColor, marginBottom: '0.25rem' }}>
                                {checkIn.fullName}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                                {checkIn.email}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                {checkIn.actualCheckInCount || checkIn.partySize} people checked in • {new Date(checkIn.createdAt).toLocaleDateString()}
                              </div>
                              {checkIn.timeslot && (
                                <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.25rem' }}>
                                  {formatDate(checkIn.timeslot.date)} at {checkIn.timeslot.start}
                                </div>
                              )}
                            </div>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              backgroundColor: '#D1FAE5',
                              color: '#065F46'
                            }}>
                              ✓ Checked In
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeslots' && (
        <TimeslotManagement timeslots={timeslots} onRefresh={fetchData} />
      )}

      {activeTab === 'bookings' && (
        <BookingsManagement />
      )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogs />
        )}

        {activeTab === 'archived' && (
          <ArchivedSlotsManagement onRefresh={fetchData} />
        )}

        {activeTab === 'admin-users' && (
          <AdminUserManagement />
        )}
    </div>
  )
}

export default AdminDashboard