import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack,
  Chip,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material'
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

  useEffect(() => {
    if (activeTab !== 'overview') {
      setRefreshing(true)
      fetchData().finally(() => setRefreshing(false))
    }
  }, [activeTab])

  const fetchData = async (timeslotFilters = {}) => {
    try {
      const timeslotParams = new URLSearchParams()
      if (timeslotFilters.archived !== undefined) {
        timeslotParams.append('archived', timeslotFilters.archived)
      }
      if (timeslotFilters.archivedBy) {
        timeslotParams.append('archivedBy', timeslotFilters.archivedBy)
      }

      const timeslotUrl = `/api/admin/timeslots${timeslotParams.toString() ? `?${timeslotParams.toString()}` : ''}`
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  const formatTime = (timeString) => timeString || 'N/A'

  const statCards = [
    {
      key: 'totalSlots',
      label: 'Total Slots',
      value: stats.totalSlots,
      color: theme.primaryColor,
      subLabel: 'Click to view →',
      hoverBorder: theme.primaryColor,
      onClick: () => setActiveTab('timeslots')
    },
    {
      key: 'publishedSlots',
      label: 'Published',
      value: stats.publishedSlots,
      color: theme.secondaryColor,
      subLabel: 'Click to view published →',
      hoverBorder: theme.secondaryColor,
      onClick: () => {
        setActiveTab('timeslots')
        window.dispatchEvent(new CustomEvent('filterTimeslots', { detail: { filter: 'published' } }))
      }
    },
    {
      key: 'totalBookings',
      label: 'Total Bookings',
      value: stats.totalBookings,
      color: theme.accentColor,
      subLabel: 'Click to view all →',
      hoverBorder: theme.accentColor,
      onClick: () => {
        setActiveTab('bookings')
        window.dispatchEvent(new CustomEvent('filterBookings', { detail: { filter: 'all' } }))
      }
    },
    {
      key: 'totalCheckIns',
      label: 'Check-ins',
      value: stats.totalCheckIns,
      color: '#10B981',
      subLabel: 'Click to filter →',
      hoverBorder: '#10B981',
      secondary: `(${stats.totalCheckedInCapacity} people)`,
      onClick: () => {
        setActiveTab('bookings')
        window.dispatchEvent(new CustomEvent('filterBookings', { detail: { filter: 'checked-in' } }))
      }
    },
    {
      key: 'waitlistEntries',
      label: 'Waitlist Entries',
      value: stats.totalWaitlistEntries,
      color: '#DC2626',
      subLabel: 'Click to view →',
      secondary: `(${stats.totalWaitlistPeople} people)`,
      hoverBorder: '#DC2626',
      onClick: () => {
        setActiveTab('timeslots')
        window.dispatchEvent(new CustomEvent('filterTimeslots', { detail: { filter: 'waitlist' } }))
      }
    }
  ]

  const tabItems = [
    { label: 'Overview', value: 'overview' },
    { label: 'Time Slots', value: 'timeslots' },
    { label: 'Bookings', value: 'bookings' },
    { label: 'Audit Logs', value: 'audit-logs' },
    { label: 'Archived Slots', value: 'archived' },
    { label: 'Admin Users Management', value: 'admin-users' },
    { label: 'Settings', value: 'settings' }
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: theme.primaryColor }} />
          <Typography sx={{ color: theme.primaryColor, fontWeight: 600 }}>
            Loading admin dashboard...
          </Typography>
        </Stack>
      </Box>
    )
  }

  const renderOverview = () => (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 2, boxShadow: '0 6px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: theme.primaryColor, fontWeight: 700, mb: 1 }}>
            Overview
          </Typography>
          <Typography color="text.secondary">
            Welcome to your DarshanFlow Admin Dashboard. Use the tabs above to manage your time slots,
            bookings, and settings.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, boxShadow: '0 6px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: theme.primaryColor, fontWeight: 700, mb: 3 }}>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ color: theme.secondaryColor, fontWeight: 600 }}>
                  Recent Bookings
                </Typography>
                {recentActivity.recentBookings.length === 0 ? (
                  <Typography color="text.secondary" fontStyle="italic">
                    No recent bookings
                  </Typography>
                ) : (
                  <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                    {recentActivity.recentBookings.slice(0, 5).map((booking) => (
                      <Paper
                        key={booking.id}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, borderColor: '#E5E7EB' }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={600} color={theme.textColor}>
                              {booking.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Party of {booking.partySize} • {new Date(booking.createdAt).toLocaleDateString()}
                            </Typography>
                            {booking.timeslot && (
                              <Typography variant="body2" sx={{ color: theme.primaryColor, fontWeight: 600 }}>
                                {formatDate(booking.timeslot.date)} at {booking.timeslot.start}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            label={booking.checkedIn ? 'Checked In' : 'Pending'}
                            size="small"
                            sx={{
                              backgroundColor: booking.checkedIn ? '#D1FAE5' : '#FEE2E2',
                              color: booking.checkedIn ? '#065F46' : '#DC2626',
                              fontWeight: 600
                            }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ color: '#10B981', fontWeight: 600 }}>
                  Recent Check-ins
                </Typography>
                {recentActivity.recentCheckIns.length === 0 ? (
                  <Typography color="text.secondary" fontStyle="italic">
                    No recent check-ins
                  </Typography>
                ) : (
                  <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                    {recentActivity.recentCheckIns.slice(0, 5).map((checkIn) => (
                      <Paper
                        key={checkIn.id}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={600} color={theme.textColor}>
                              {checkIn.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {checkIn.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {(checkIn.actualCheckInCount || checkIn.partySize)} people checked in •{' '}
                              {new Date(checkIn.createdAt).toLocaleDateString()}
                            </Typography>
                            {checkIn.timeslot && (
                              <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                                {formatDate(checkIn.timeslot.date)} at {formatTime(checkIn.timeslot.start)}
                              </Typography>
                            )}
                          </Stack>
                          <Chip
                            label="✓ Checked In"
                            size="small"
                            sx={{
                              backgroundColor: '#D1FAE5',
                              color: '#065F46',
                              fontWeight: 600
                            }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ color: theme.primaryColor, fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.textColor }}>
            Welcome back, {user?.name || user?.email}!
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {statCards.map((card) => (
            <Grid item key={card.key} xs={12} sm={6} md={4} lg={12 / statCards.length}>
              <Card
                onClick={card.onClick}
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '2px solid transparent',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
                    borderColor: card.hoverBorder
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: card.color, fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: theme.textColor, fontWeight: 600 }}>
                    {card.label}
                  </Typography>
                  {card.secondary && (
                    <Typography variant="subtitle2" sx={{ color: card.color, fontWeight: 600, mt: 0.5 }}>
                      {card.secondary}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                    {card.subLabel}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box position="relative">
          {refreshing && (
            <Chip
              label="Refreshing…"
              color="success"
              size="small"
              sx={{ position: 'absolute', top: -14, right: 0, zIndex: 1, fontWeight: 600 }}
            />
          )}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            scrollButtons
            sx={{
              borderBottom: `1px solid ${theme.backgroundColor}`,
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '4px 4px 0 0',
                backgroundColor: theme.primaryColor
              }
            }}
          >
            {tabItems.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  minHeight: 56,
                  color: activeTab === tab.value ? theme.primaryColor : theme.textColor,
                  '&.Mui-selected': {
                    color: theme.primaryColor
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Divider />

        {activeTab === 'overview' && renderOverview()}

        {activeTab === 'timeslots' && <TimeslotManagement timeslots={timeslots} onRefresh={fetchData} />}

        {activeTab === 'bookings' && <BookingsManagement />}

        {activeTab === 'audit-logs' && <AuditLogs />}

        {activeTab === 'archived' && <ArchivedSlotsManagement onRefresh={fetchData} />}

        {activeTab === 'admin-users' && <AdminUserManagement />}

        {activeTab === 'settings' && <SettingsPage />}
      </Stack>
    </Box>
  )
}

export default AdminDashboard