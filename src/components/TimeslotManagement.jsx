import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const TimeslotManagement = ({ timeslots, onRefresh }) => {
  console.log('TimeslotManagement component loaded with filters')
  const { theme } = useTheme()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [formData, setFormData] = useState(() => {
    // Get today's date in local timezone, avoiding UTC conversion issues
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayString = `${year}-${month}-${day}`
    console.log('Initial formData date set to:', todayString, '(System date:', now.toDateString(), ')')
    return {
      date: todayString,
      start: '',
      end: '',
      capacity: 10,
      publish: false,
      // Auto-publishing fields
      autoPublishEnabled: false,
      autoPublishType: 'scheduled', // 'scheduled' or 'hours_before'
      autoPublishDateTime: '',
      autoPublishHoursBefore: 24
    }
  })
  const [showCheckedInModal, setShowCheckedInModal] = useState(false)
  const [selectedTimeslot, setSelectedTimeslot] = useState(null)
  const [checkedInRegistrations, setCheckedInRegistrations] = useState([])
  const [loadingCheckedIn, setLoadingCheckedIn] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'published', 'draft', 'auto-archive', 'archived'
  const [dateFilter, setDateFilter] = useState('') // Filter by specific date
  const [dateRangeFilter, setDateRangeFilter] = useState('all') // 'all', 'today', 'tomorrow', 'this-week', 'next-week'

  // Initialize form with default date (today)
  useEffect(() => {
    if (showCreateForm) {
      // Get today's date in local timezone, avoiding UTC conversion issues
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayString = `${year}-${month}-${day}`
      console.log('Setting form date to today:', todayString, '(System date:', now.toDateString(), ')')

      setFormData(prev => ({
        ...prev,
        date: prev.date || todayString
      }))
    }

    // Listen for filter events from the dashboard
    const handleFilterEvent = (event) => {
      if (event.detail && event.detail.filter) {
        setStatusFilter(event.detail.filter)
      }
    }
    
    window.addEventListener('filterTimeslots', handleFilterEvent)
    
    return () => {
      window.removeEventListener('filterTimeslots', handleFilterEvent)
    }
  }, [showCreateForm])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Helper function to get current filter parameters
  const getCurrentFilters = () => {
    const filters = {}
    
    if (statusFilter === 'archived') {
      filters.archived = true
    } else if (statusFilter === 'auto-archived') {
      filters.archived = true
      filters.archivedBy = 'system'
    } else if (statusFilter === 'admin-archived') {
      filters.archived = true
      filters.archivedBy = 'admin'
    } else if (statusFilter !== 'all') {
      // For other status filters, we don't need archived=true
      filters.archived = false
    }
    
    return filters
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    // Get today's date in local timezone, avoiding UTC conversion issues
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayString = `${year}-${month}-${day}`
    
    setFormData({
      date: todayString,
      start: '',
      end: '',
      capacity: 10,
      publish: false,
      // Auto-publishing fields
      autoPublishEnabled: false,
      autoPublishType: 'scheduled',
      autoPublishDateTime: '',
      autoPublishHoursBefore: 24
    })
    setError('')
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingSlot(null)
    resetForm()
  }

  const handleEdit = (slot) => {
    setEditingSlot(slot)
    setFormData({
      date: new Date(slot.date).toISOString().split('T')[0],
      start: slot.start,
      end: slot.end || '',
      capacity: slot.capacity,
      publish: slot.published,
      // Auto-publishing fields
      autoPublishEnabled: slot.autoPublishEnabled || false,
      autoPublishType: slot.autoPublishType || 'scheduled',
      autoPublishDateTime: slot.autoPublishDateTime ? new Date(slot.autoPublishDateTime).toISOString().slice(0, 16) : '',
      autoPublishHoursBefore: slot.autoPublishHoursBefore || 24
    })
    setShowCreateForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate date is not in the past (timezone-safe)
    const dateParts = formData.date.split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2])
    const selectedDate = new Date(year, month, day)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    console.log('Date validation - Selected date:', selectedDate.toDateString(), 'Today:', today.toDateString())
    
    if (selectedDate < today) {
      setError('Cannot create slots for past dates')
      setLoading(false)
      return
    }

    try {
      const url = editingSlot ? `/api/admin/timeslots/${editingSlot.id}` : '/api/admin/timeslots'
      const method = editingSlot ? 'PUT' : 'POST'
      
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}`
      const urlWithCache = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`
      
      const response = await fetch(urlWithCache, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // If slot was copied (archived slot with bookings/waitlist), show success message
        if (result.isCopy && result.message) {
          alert(result.message)
        }
        
        // Keep the same date for convenience, reset other fields
        const currentDate = formData.date
        setFormData({
          date: currentDate,
          start: '',
          end: '',
          capacity: 10,
          publish: false,
          // Auto-publishing fields
          autoPublishEnabled: false,
          autoPublishType: 'scheduled',
          autoPublishDateTime: '',
          autoPublishHoursBefore: 24
        })
        setShowCreateForm(false)
        setEditingSlot(null)
        onRefresh(getCurrentFilters())
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${editingSlot ? 'update' : 'create'} timeslot`)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishToggle = async (slotId, currentStatus) => {
    try {
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}`
      const response = await fetch(`/api/admin/timeslots/${slotId}/publish?${cacheBuster}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ publish: !currentStatus }),
      })

      if (response.ok) {
        onRefresh(getCurrentFilters())
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update timeslot')
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const handleArchive = async (slotId) => {
    if (!window.confirm('Are you sure you want to archive this timeslot? It will be moved to archived slots.')) {
      return
    }

    try {
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}`
      const response = await fetch(`/api/admin/timeslots/${slotId}/archive?${cacheBuster}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        onRefresh(getCurrentFilters())
      } else {
        setError('Failed to archive timeslot')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to permanently delete this timeslot? This action cannot be undone.')) {
      return
    }

    try {
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}`
      const response = await fetch(`/api/admin/timeslots/${slotId}?${cacheBuster}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        onRefresh(getCurrentFilters())
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete timeslot')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const handleCheckedInClick = async (timeslot) => {
    if (timeslot.stats?.totalCheckedIn === 0) return
    
    setSelectedTimeslot(timeslot)
    setLoadingCheckedIn(true)
    
    try {
      const response = await fetch(`/api/admin/timeslots/${timeslot.id}/checked-in`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const registrations = await response.json()
        setCheckedInRegistrations(registrations)
        setShowCheckedInModal(true)
      } else {
        setError('Failed to load checked-in details')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoadingCheckedIn(false)
    }
  }

  const handleCloseCheckedInModal = () => {
    setShowCheckedInModal(false)
    setSelectedTimeslot(null)
    setCheckedInRegistrations([])
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  // Filter timeslots based on selected status and date filters
  const filteredTimeslots = timeslots.filter(timeslot => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'published' && (!timeslot.published || timeslot.archived)) return false
      if (statusFilter === 'draft' && (timeslot.published || timeslot.archived)) return false
      if (statusFilter === 'waitlist') {
        // Show only slots that have waitlist entries
        const waitlistCount = timeslot.waitlist?.count || 0;
        if (waitlistCount === 0) return false
      }
      if (statusFilter === 'auto-archive') {
        // Show unpublished slots that are past their date
        if (timeslot.published || timeslot.archived) return false
        const slotDate = new Date(timeslot.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        slotDate.setHours(0, 0, 0, 0);
        if (slotDate >= today) return false
      }
      if (statusFilter === 'archived') {
        // Show all archived slots (both published and unpublished)
        if (!timeslot.archived) return false
      }
      if (statusFilter === 'auto-archived') {
        // Show only auto-archived slots
        if (!timeslot.archived || timeslot.archivedBy !== 'system') return false
      }
      if (statusFilter === 'admin-archived') {
        // Show only admin-archived slots
        if (!timeslot.archived || timeslot.archivedBy === 'system') return false
      }
    }

    // Date filtering logic - prioritize specific date over date range
    if (dateFilter) {
      // If specific date is selected, only use that filter and ignore date range
      // Use local date comparison to avoid timezone issues
      const slotDate = new Date(timeslot.date)
      const filterDate = new Date(dateFilter + 'T00:00:00') // Force local timezone
      
      // Compare dates by year, month, and day only
      const slotYear = slotDate.getFullYear()
      const slotMonth = slotDate.getMonth()
      const slotDay = slotDate.getDate()
      
      const filterYear = filterDate.getFullYear()
      const filterMonth = filterDate.getMonth()
      const filterDay = filterDate.getDate()
      
      const isMatch = slotYear === filterYear && slotMonth === filterMonth && slotDay === filterDay
      
      console.log('Date Filter Debug:', {
        selectedDate: dateFilter,
        slotDate: `${slotYear}-${slotMonth + 1}-${slotDay}`,
        timeslotDate: timeslot.date,
        match: isMatch
      })
      
      if (!isMatch) return false
    } else if (dateRangeFilter !== 'all') {
      // Only apply date range filter if no specific date is selected
      const slotDate = new Date(timeslot.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      switch (dateRangeFilter) {
        case 'today':
          if (slotDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0]) return false
          break
        case 'tomorrow':
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          if (slotDate.toISOString().split('T')[0] !== tomorrow.toISOString().split('T')[0]) return false
          break
        case 'this-week':
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          if (slotDate < startOfWeek || slotDate > endOfWeek) return false
          break
        case 'next-week':
          const nextWeekStart = new Date(today)
          nextWeekStart.setDate(today.getDate() - today.getDay() + 7)
          const nextWeekEnd = new Date(nextWeekStart)
          nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
          if (slotDate < nextWeekStart || slotDate > nextWeekEnd) return false
          break
        case 'past':
          if (slotDate >= today) return false
          break
        case 'future':
          if (slotDate < today) return false
          break
      }
    }

    return true
  })

  // Helper function for timezone-aware date comparison
  const isPastDateInUserTimezone = (slotDate) => {
    try {
      // Get current date in user's timezone
      const now = new Date();
      const userNow = new Date(now.toLocaleString('en-US'));
      
      // Get slot date in user's timezone
      const userSlotDate = new Date(slotDate.toLocaleString('en-US'));
      
      // Normalize both to start of day
      const userToday = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
      const userSlotDay = new Date(userSlotDate.getFullYear(), userSlotDate.getMonth(), userSlotDate.getDate());
      
      return userSlotDay < userToday;
    } catch (error) {
      console.error('Error in timezone comparison:', error);
      // Fallback to simple comparison
      const slotDate = new Date(slotDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate < today;
    }
  };

  const formatDate = (dateString) => {
    // Parse the date string and create a local date to avoid timezone issues
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Create a new date in local timezone
    const localDate = new Date(year, month, day);
    
    return localDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString || 'N/A'
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

  return (
    <div>
      <div style={cardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: theme.primaryColor, margin: 0 }}>
                Time Slots Management
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => onRefresh(getCurrentFilters())}
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
                <button
                  onClick={async () => {
                    try {
                      // Add cache-busting parameter to prevent stale data
                      const cacheBuster = `_t=${Date.now()}`
                      const response = await fetch(`/api/admin/trigger-auto-archive?${cacheBuster}`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      const result = await response.json();
                      if (response.ok) {
                        alert(`Auto-archive completed: ${result.message}`);
                        onRefresh(getCurrentFilters()); // Refresh the data
                      } else {
                        alert(`Error: ${result.error}`);
                      }
                    } catch (error) {
                      alert('Error triggering auto-archive');
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F59E0B',
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
                    e.target.style.backgroundColor = '#D97706'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#F59E0B'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  🗂️ Trigger Auto-Archive
                </button>
                <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 'bold' }}>
                  ✅ Date Filters Enabled
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ 
                    fontWeight: 'bold', 
                    color: theme.textColor,
                    fontSize: '0.9rem'
                  }}>
                    Status:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    style={{
                      padding: '0.5rem 1rem',
                      border: `2px solid ${theme.primaryColor}`,
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      backgroundColor: theme.backgroundColor,
                      color: theme.textColor,
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    <option value="all">All Slots</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="waitlist">Has Waitlist</option>
                    <option value="auto-archive">Will Auto-Archive</option>
                    <option value="archived">All Archived</option>
                    <option value="auto-archived">Auto-Archived</option>
                    <option value="admin-archived">Admin Archived</option>
                  </select>
                </div>
                
                <button 
                  style={buttonStyles}
                  onClick={() => showCreateForm ? handleCancel() : setShowCreateForm(true)}
                >
                  {showCreateForm ? 'Cancel' : '+ Add New Slot'}
                </button>
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

        {showCreateForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '6px' }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
              {editingSlot ? 'Edit Time Slot' : 'Create New Time Slot'}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={(e) => {
                    console.log('Date input changed from', formData.date, 'to', e.target.value)
                    handleChange(e)
                  }}
                  required
                  min={(() => {
                    // Get today's date in local timezone, avoiding UTC conversion issues
                    const now = new Date()
                    const year = now.getFullYear()
                    const month = String(now.getMonth() + 1).padStart(2, '0')
                    const day = String(now.getDate()).padStart(2, '0')
                    return `${year}-${month}-${day}`
                  })()}
                  max="2030-12-31"
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  name="start"
                  value={formData.start}
                  onChange={handleChange}
                  required
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  End Time
                </label>
                <input
                  type="time"
                  name="end"
                  value={formData.end}
                  onChange={handleChange}
                  style={inputStyles}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  required
                  style={inputStyles}
                />
              </div>
            </div>

            <div style={{ margin: '1rem 0' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                color: theme.textColor
              }}>
                <input
                  type="checkbox"
                  name="publish"
                  checked={formData.publish}
                  onChange={handleChange}
                  style={{ width: 'auto' }}
                />
                Publish immediately (make visible to visitors)
              </label>
            </div>

            {/* Auto-Publishing Section */}
            <div style={{ 
              margin: '1.5rem 0', 
              padding: '1rem', 
              backgroundColor: '#F8FAFC', 
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              <h5 style={{ 
                color: theme.primaryColor, 
                marginBottom: '1rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}>
                🤖 Auto-Publishing Options
              </h5>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  color: theme.textColor,
                  marginBottom: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    name="autoPublishEnabled"
                    checked={formData.autoPublishEnabled}
                    onChange={handleChange}
                    style={{ width: 'auto' }}
                  />
                  Enable auto-publishing (slot will be published automatically)
                </label>
              </div>

              {formData.autoPublishEnabled && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'white', 
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      color: theme.textColor
                    }}>
                      Auto-Publish Method
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        color: theme.textColor
                      }}>
                        <input
                          type="radio"
                          name="autoPublishType"
                          value="scheduled"
                          checked={formData.autoPublishType === 'scheduled'}
                          onChange={handleChange}
                          style={{ width: 'auto' }}
                        />
                        Publish at specific date/time
                      </label>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        color: theme.textColor
                      }}>
                        <input
                          type="radio"
                          name="autoPublishType"
                          value="hours_before"
                          checked={formData.autoPublishType === 'hours_before'}
                          onChange={handleChange}
                          style={{ width: 'auto' }}
                        />
                        Publish X hours before slot time
                      </label>
                    </div>
                  </div>

                  {formData.autoPublishType === 'scheduled' && (
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem',
                        fontWeight: 'bold',
                        color: theme.textColor
                      }}>
                        Publish Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="autoPublishDateTime"
                        value={formData.autoPublishDateTime}
                        onChange={handleChange}
                        min={(() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return today.toISOString().slice(0, 16);
                        })()}
                        style={inputStyles}
                      />
                    </div>
                  )}

                  {formData.autoPublishType === 'hours_before' && (
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem',
                        fontWeight: 'bold',
                        color: theme.textColor
                      }}>
                        Hours Before Slot Time
                      </label>
                      <input
                        type="number"
                        name="autoPublishHoursBefore"
                        value={formData.autoPublishHoursBefore}
                        onChange={handleChange}
                        min="1"
                        max="168" // Max 1 week
                        style={inputStyles}
                      />
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6B7280', 
                        marginTop: '0.25rem' 
                      }}>
                        Slot will be published {formData.autoPublishHoursBefore} hours before the slot time
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#92400E'
                  }}>
                    <strong>💡 Note:</strong> Auto-publishing will only work if the slot is not already published manually. 
                    Once auto-published, the slot will remain published.
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...buttonStyles,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (editingSlot ? 'Updating...' : 'Creating...') : (editingSlot ? 'Update Time Slot' : 'Create Time Slot')}
            </button>
          </form>
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
            Filter Time Slots
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Date Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: theme.textColor,
                fontSize: '0.9rem'
              }}>
                Filter by Specific Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={inputStyles}
              />
            </div>

            {/* Date Range Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: dateFilter ? '#9CA3AF' : theme.textColor,
                fontSize: '0.9rem'
              }}>
                Filter by Date Range
                {dateFilter && (
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#6B7280', 
                    fontWeight: 'normal',
                    marginLeft: '0.5rem'
                  }}>
                    (Disabled - Specific date selected)
                  </span>
                )}
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                disabled={!!dateFilter}
                style={{
                  ...inputStyles,
                  marginBottom: '0',
                  backgroundColor: dateFilter ? '#F3F4F6' : theme.backgroundColor,
                  color: dateFilter ? '#9CA3AF' : theme.textColor,
                  cursor: dateFilter ? 'not-allowed' : 'pointer',
                  opacity: dateFilter ? 0.6 : 1
                }}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="this-week">This Week</option>
                <option value="next-week">Next Week</option>
                <option value="past">Past Dates</option>
                <option value="future">Future Dates</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              onClick={() => {
                setDateFilter('')
                setDateRangeFilter('all')
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
          
          {/* Filter Status Display */}
          {(dateFilter || dateRangeFilter !== 'all' || statusFilter !== 'all') && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#F0F9FF', 
              borderRadius: '6px',
              border: '1px solid #0EA5E9'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#0C4A6E', fontWeight: 'bold' }}>
                Active Filters:
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0C4A6E', marginTop: '0.25rem' }}>
                {dateFilter && (
                  <span style={{ 
                    display: 'inline-block', 
                    marginRight: '1rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#0EA5E9',
                    color: 'white',
                    borderRadius: '4px'
                  }}>
                    📅 Date: {(() => {
                      const filterDate = new Date(dateFilter + 'T00:00:00')
                      return filterDate.toLocaleDateString()
                    })()} (Raw: {dateFilter})
                  </span>
                )}
                {!dateFilter && dateRangeFilter !== 'all' && (
                  <span style={{ 
                    display: 'inline-block', 
                    marginRight: '1rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#0EA5E9',
                    color: 'white',
                    borderRadius: '4px'
                  }}>
                    📅 Range: {dateRangeFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span style={{ 
                    display: 'inline-block', 
                    marginRight: '1rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: statusFilter === 'waitlist' ? '#DC2626' : '#0EA5E9',
                    color: 'white',
                    borderRadius: '4px'
                  }}>
                    📊 Status: {
                      statusFilter === 'published' ? 'Published' : 
                      statusFilter === 'draft' ? 'Draft' : 
                      statusFilter === 'waitlist' ? 'Has Waitlist' :
                      statusFilter === 'archived' ? 'All Archived' : 
                      statusFilter === 'auto-archived' ? 'Auto-Archived' : 
                      statusFilter === 'admin-archived' ? 'Admin Archived' : 
                      'Will Auto-Archive'
                    }
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Date</th>
              <th style={thStyles}>Time</th>
              <th style={thStyles}>Capacity</th>
              <th style={thStyles}>Remaining</th>
              <th style={thStyles}>Bookings</th>
              <th style={thStyles}>Waitlist</th>
              <th style={thStyles}>Checked In</th>
              <th style={thStyles}>Status</th>
              <th style={thStyles}>Auto-Publish</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
                <tbody>
                  {filteredTimeslots.map((slot) => {
                    // Check if slot is from past date using timezone-aware comparison
                    const isPastDate = isPastDateInUserTimezone(slot.date);

                    return (
              <tr key={slot.id} style={{ 
                backgroundColor: isPastDate ? '#FEF2F2' : 'transparent',
                opacity: isPastDate ? 0.8 : 1
              }}>
                <td style={tdStyles}>
                  {formatDate(slot.date)}
                  {isPastDate && (
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#DC2626',
                      fontWeight: 'bold',
                      marginTop: '0.25rem'
                    }}>
                      ⚠️ Past Date
                    </div>
                  )}
                </td>
                <td style={tdStyles}>
                  {formatTime(slot.start)}
                  {slot.end && ` - ${formatTime(slot.end)}`}
                </td>
                <td style={tdStyles}>{slot.capacity}</td>
                <td style={tdStyles}>{slot.remaining || slot.capacity}</td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{slot.stats?.totalBookings || 0}</strong> bookings
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    ({slot.stats?.totalPeopleBooked || 0} people)
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong style={{ 
                      color: slot.waitlist?.full ? '#DC2626' : slot.waitlist?.count > 0 ? '#F59E0B' : '#6B7280'
                    }}>
                      {slot.waitlist?.count || 0}/{slot.waitlist?.capacity || 0}
                    </strong>
                    {slot.waitlist?.full && (
                      <span style={{ fontSize: '0.75rem', color: '#DC2626', marginLeft: '0.25rem' }}>FULL</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    ({slot.waitlist?.people || 0} people)
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span 
                      style={{ 
                        color: slot.stats?.totalCheckedIn > 0 ? '#10B981' : '#6B7280',
                        cursor: slot.stats?.totalCheckedIn > 0 ? 'pointer' : 'default',
                        textDecoration: slot.stats?.totalCheckedIn > 0 ? 'underline' : 'none',
                        fontWeight: 'bold'
                      }}
                      onClick={() => slot.stats?.totalCheckedIn > 0 && handleCheckedInClick(slot)}
                    >
                      {slot.stats?.totalCheckedIn || 0} checked in
                    </span>
                  </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                          ({slot.stats?.totalPeopleCheckedIn || 0} people)
                        </div>
                        {slot.stats?.totalBookings > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.25rem' }}>
                            {Math.round(((slot.stats?.totalCheckedIn || 0) / slot.stats.totalBookings) * 100)}% check-in rate
                          </div>
                        )}
                      </td>
                <td style={tdStyles}>
                  <div>
                    {slot.archived ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: slot.archivedBy === 'system' ? '#FEF3C7' : '#FEE2E2',
                        color: slot.archivedBy === 'system' ? '#92400E' : '#DC2626',
                        fontWeight: 'bold'
                      }}>
                        {slot.archivedBy === 'system' ? '🔄 Auto-Archived' : '📦 Archived'}
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: slot.published ? '#D1FAE5' : '#FEE2E2',
                        color: slot.published ? '#065F46' : '#DC2626'
                      }}>
                        {slot.published ? 'Published' : 'Draft'}
                      </span>
                    )}
                    
                    {/* Auto-archive warning for unpublished slots past their date */}
                    {!slot.published && !slot.archived && (() => {
                      const slotDate = new Date(slot.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      slotDate.setHours(0, 0, 0, 0);
                      
                      if (slotDate < today) {
                        return (
                          <div style={{ marginTop: '0.25rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}>
                              ⚠️ Will auto-archive
                            </span>
                            <div style={{ fontSize: '0.6rem', color: '#6B7280', marginTop: '0.125rem' }}>
                              Past date - unpublished
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </td>
                <td style={tdStyles}>
                  {slot.autoPublishEnabled ? (
                    <div style={{ fontSize: '0.8rem' }}>
                      {slot.autoPublished ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: '#D1FAE5',
                          color: '#065F46',
                          fontWeight: 'bold'
                        }}>
                          ✅ Auto-Published
                        </span>
                      ) : (
                        <div>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontWeight: 'bold'
                          }}>
                            ⏰ Scheduled
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.25rem' }}>
                            {slot.autoPublishType === 'scheduled' && slot.autoPublishDateTime ? (
                              <>Publish: {new Date(slot.autoPublishDateTime).toLocaleString()}</>
                            ) : slot.autoPublishType === 'hours_before' && slot.autoPublishHoursBefore ? (
                              <>Publish {slot.autoPublishHoursBefore}h before slot</>
                            ) : (
                              'Auto-publish configured'
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#F3F4F6',
                      color: '#6B7280',
                      fontSize: '0.8rem'
                    }}>
                      Manual
                    </span>
                  )}
                </td>
                <td style={tdStyles}>
                  <button 
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      margin: '0.25rem'
                    }}
                    onClick={() => handleEdit(slot)}
                  >
                    Edit
                  </button>
                  <button 
                    style={{
                      ...buttonStyles,
                      backgroundColor: isPastDate ? '#9CA3AF' : (slot.published ? '#10B981' : '#059669'),
                      cursor: isPastDate ? 'not-allowed' : 'pointer',
                      opacity: isPastDate ? 0.6 : 1
                    }}
                    onClick={() => handlePublishToggle(slot.id, slot.published)}
                    disabled={isPastDate}
                    title={isPastDate ? 'Cannot publish past-dated slots' : (slot.published ? 'Unpublish this slot' : 'Publish this slot')}
                  >
                    {isPastDate ? 'Cannot Publish' : (slot.published ? 'Unpublish' : 'Publish')}
                  </button>
                  <button 
                    style={{
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      margin: '0.25rem'
                    }}
                    onClick={() => handleArchive(slot.id)}
                  >
                    Archive
                  </button>
                  <button 
                    style={dangerButtonStyles}
                    onClick={() => handleDelete(slot.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
                    );
                  })}
          </tbody>
        </table>

        {filteredTimeslots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
            {timeslots.length === 0 
              ? 'No time slots created yet. Click "Add New Slot" to get started.'
              : 'No time slots found matching the current filter criteria. Try adjusting your filters.'
            }
          </div>
        )}

        {/* Filter Results Summary */}
        {timeslots.length > 0 && (
          <div style={{
            backgroundColor: '#F3F4F6',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: theme.textColor
          }}>
            <strong>Showing {filteredTimeslots.length} of {timeslots.length} time slots</strong>
            {(statusFilter !== 'all' || dateFilter || dateRangeFilter !== 'all') && (
              <span> - Filtered by: 
                {statusFilter !== 'all' && <strong> {
                  statusFilter === 'published' ? 'Published' : 
                  statusFilter === 'draft' ? 'Draft' : 
                  statusFilter === 'waitlist' ? 'Has Waitlist' :
                  statusFilter === 'archived' ? 'All Archived' : 
                  statusFilter === 'auto-archived' ? 'Auto-Archived' : 
                  statusFilter === 'admin-archived' ? 'Admin Archived' : 
                  'Will Auto-Archive'
                }</strong>}
                {dateFilter && <strong> Date: {(() => {
                  const filterDate = new Date(dateFilter + 'T00:00:00')
                  return filterDate.toLocaleDateString()
                })()} (Raw: {dateFilter})</strong>}
                {!dateFilter && dateRangeFilter !== 'all' && <strong> Range: {dateRangeFilter.replace('-', ' ')}</strong>}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Checked-in Details Modal */}
      {showCheckedInModal && selectedTimeslot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.backgroundColor,
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            minWidth: '600px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            color: theme.textColor
          }}>
            <h3 style={{ 
              color: theme.primaryColor, 
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Checked-in Visitors Details
            </h3>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
              <p><strong>Event:</strong> {formatDate(selectedTimeslot.date)} at {formatTime(selectedTimeslot.start)} - {formatTime(selectedTimeslot.end)}</p>
              <p><strong>Total Checked-in:</strong> {selectedTimeslot.stats?.totalCheckedIn} bookings ({selectedTimeslot.stats?.totalPeopleCheckedIn} people)</p>
            </div>

            {loadingCheckedIn ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '1.2rem', color: theme.primaryColor }}>
                  Loading checked-in details...
                </div>
              </div>
            ) : checkedInRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
                No checked-in registrations found.
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      Visitor Name
                    </th>
                    <th style={{
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      Email
                    </th>
                    <th style={{
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      Phone
                    </th>
                    <th style={{
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      Booked
                    </th>
                    <th style={{
                      backgroundColor: theme.primaryColor,
                      color: 'white',
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #ddd'
                    }}>
                      Actually Checked In
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {checkedInRegistrations.map((registration) => (
                    <tr key={registration.id}>
                      <td style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        backgroundColor: theme.backgroundColor
                      }}>
                        {registration.fullName}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        backgroundColor: theme.backgroundColor
                      }}>
                        {registration.email}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        backgroundColor: theme.backgroundColor
                      }}>
                        {registration.phone}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        backgroundColor: theme.backgroundColor,
                        textAlign: 'center'
                      }}>
                        {registration.partySize} people
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        backgroundColor: theme.backgroundColor,
                        textAlign: 'center',
                        color: '#10B981',
                        fontWeight: 'bold'
                      }}>
                        {registration.actualCheckInCount || registration.partySize} people
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginTop: '2rem'
            }}>
              <button 
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: theme.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                onClick={handleCloseCheckedInModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeslotManagement
