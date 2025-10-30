import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ArchivedSlotsManagement = ({ onRefresh }) => {
  const { theme } = useTheme()
  const [archivedSlots, setArchivedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [archivedByFilter, setArchivedByFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [archivedDateFilter, setArchivedDateFilter] = useState('')

  useEffect(() => {
    fetchArchivedSlots()
  }, [])

  const fetchArchivedSlots = async () => {
    try {
      // Add aggressive cache-busting parameter to prevent stale data
      const cacheBuster = `_t=${Date.now()}&_v=2`
      const response = await fetch(`/api/admin/timeslots/archived?${cacheBuster}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (response.ok) {
        const slots = await response.json()
        setArchivedSlots(slots)
      } else {
        setError('Failed to load archived slots')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Filter slots based on current filter settings
  const filteredSlots = archivedSlots.filter(slot => {
    // Filter by Archived By
    if (archivedByFilter !== 'all') {
      if (archivedByFilter === 'system' && slot.archivedBy !== 'system') return false
      if (archivedByFilter === 'admin' && (slot.archivedBy === 'system' || slot.archivedBy === null)) return false
      if (archivedByFilter === 'legacy' && slot.archivedBy !== null) return false
    }
    
    // Filter by Date (slot date)
    if (dateFilter) {
      const slotDate = new Date(slot.date).toISOString().slice(0, 10)
      if (slotDate !== dateFilter) return false
    }
    
    // Filter by Archived Date
    if (archivedDateFilter) {
      const archivedDate = new Date(slot.updatedAt).toISOString().slice(0, 10)
      if (archivedDate !== archivedDateFilter) return false
    }
    
    return true
  })

  const clearAllFilters = () => {
    setArchivedByFilter('all')
    setDateFilter('')
    setArchivedDateFilter('')
  }

  const handleRestore = async (slotId, slotDate) => {
    // Check if slot is from past date
    const slotDateObj = new Date(slotDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDateObj.setHours(0, 0, 0, 0);
    const isPastDate = slotDateObj < today;

    const confirmMessage = isPastDate 
      ? 'This timeslot is from a past date. It will be restored as Draft status and cannot be published. Continue?'
      : 'Are you sure you want to restore this timeslot from archive?';

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/timeslots/${slotId}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        fetchArchivedSlots()
        onRefresh()
        
        // Show success message
        if (result.message) {
          alert(result.message)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to restore timeslot')
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
          Loading archived slots...
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={cardStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: theme.primaryColor, margin: 0 }}>
            Archived Time Slots
          </h3>
          <button
            onClick={fetchArchivedSlots}
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

        <p style={{ color: theme.textColor, marginBottom: '1rem' }}>
          These are archived timeslots that are no longer active but preserved for reporting purposes.
          <br />
          <strong style={{ color: '#059669' }}>✅ Past-dated slots can be restored as Draft</strong> - but they cannot be published.
          <br />
          <strong style={{ color: '#DC2626' }}>⚠️ Future-dated slots can be restored and published normally</strong>.
        </p>

        {/* Filter Section */}
        <div style={{
          backgroundColor: theme.backgroundColor === '#1a1a1a' ? '#2a2a2a' : '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: `1px solid ${theme.borderColor}`
        }}>
          <h4 style={{ color: theme.primaryColor, margin: '0 0 1rem 0', fontSize: '1rem' }}>
            🔍 Filter Archived Slots
          </h4>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
            {/* Archived By Filter */}
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                color: theme.textColor, 
                fontSize: '0.9rem', 
                marginBottom: '0.25rem',
                fontWeight: 'bold'
              }}>
                Archived By:
              </label>
              <select
                value={archivedByFilter}
                onChange={(e) => setArchivedByFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.borderColor}`,
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '0.9rem'
                }}
              >
                <option value="all">All Types</option>
                <option value="system">🤖 Auto-Archived</option>
                <option value="admin">👤 Admin Archived</option>
                <option value="legacy">📁 Legacy Archived</option>
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ minWidth: '180px' }}>
              <label style={{ 
                display: 'block', 
                color: theme.textColor, 
                fontSize: '0.9rem', 
                marginBottom: '0.25rem',
                fontWeight: 'bold'
              }}>
                Slot Date:
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.borderColor}`,
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Archived Date Filter */}
            <div style={{ minWidth: '180px' }}>
              <label style={{ 
                display: 'block', 
                color: theme.textColor, 
                fontSize: '0.9rem', 
                marginBottom: '0.25rem',
                fontWeight: 'bold'
              }}>
                Archived Date:
              </label>
              <input
                type="date"
                value={archivedDateFilter}
                onChange={(e) => setArchivedDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${theme.borderColor}`,
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Clear Filters Button */}
            <div>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(archivedByFilter !== 'all' || dateFilter || archivedDateFilter) && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              backgroundColor: theme.primaryColor + '20',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              <strong style={{ color: theme.primaryColor }}>Active Filters:</strong>
              {archivedByFilter !== 'all' && (
                <span style={{ marginLeft: '0.5rem', color: theme.textColor }}>
                  Archived By: {archivedByFilter === 'system' ? '🤖 Auto-Archived' : 
                                archivedByFilter === 'admin' ? '👤 Admin Archived' : 
                                '📁 Legacy Archived'}
                </span>
              )}
              {dateFilter && (
                <span style={{ marginLeft: '0.5rem', color: theme.textColor }}>
                  Slot Date: {dateFilter}
                </span>
              )}
              {archivedDateFilter && (
                <span style={{ marginLeft: '0.5rem', color: theme.textColor }}>
                  Archived Date: {archivedDateFilter}
                </span>
              )}
            </div>
          )}
        </div>
        
        {filteredSlots.length === 0 ? (
          <p style={{ color: theme.textColor, textAlign: 'center', padding: '2rem' }}>
            {archivedSlots.length === 0 ? 'No archived timeslots found.' : 'No slots match the current filters.'}
          </p>
        ) : (
          <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Date</th>
              <th style={thStyles}>Time</th>
              <th style={thStyles}>Capacity</th>
              <th style={thStyles}>Remaining</th>
              <th style={thStyles}>Archived By</th>
              <th style={thStyles}>Archived Date</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.map((slot) => {
              // Check if slot is from past date
              const slotDateObj = new Date(slot.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              slotDateObj.setHours(0, 0, 0, 0);
              const isPastDate = slotDateObj < today;

              return (
                <tr key={slot.id} style={{ 
                  backgroundColor: isPastDate ? '#FEF2F2' : 'transparent',
                  opacity: isPastDate ? 0.7 : 1
                }}>
                  <td style={tdStyles}>
                    {formatDate(slot.date)}
                    {isPastDate && (
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: '#DC2626',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ Past Date
                      </span>
                    )}
                  </td>
                  <td style={tdStyles}>
                    {formatTime(slot.start)}
                    {slot.end && ` - ${formatTime(slot.end)}`}
                  </td>
                  <td style={tdStyles}>{slot.capacity}</td>
                  <td style={tdStyles}>{slot.remaining || slot.capacity}</td>
                  <td style={tdStyles}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: slot.archivedBy === 'system' ? '#FEF3C7' : slot.archivedBy ? '#DBEAFE' : '#F3F4F6',
                      color: slot.archivedBy === 'system' ? '#92400E' : slot.archivedBy ? '#1E40AF' : '#6B7280'
                    }}>
                      {slot.archivedBy === 'system' ? '🤖 Auto-Archived' : slot.archivedBy ? '👤 Admin Archived' : '📁 Legacy Archived'}
                    </span>
                  </td>
                  <td style={tdStyles}>{formatDate(slot.updatedAt)}</td>
                  <td style={tdStyles}>
                    <button 
                      style={{
                        ...buttonStyles,
                        backgroundColor: theme.secondaryColor,
                        cursor: 'pointer',
                        opacity: 1
                      }}
                      onClick={() => handleRestore(slot.id, slot.date)}
                      title={isPastDate ? 'Restore as Draft (past date - cannot be published)' : 'Restore this timeslot'}
                    >
                      {isPastDate ? 'Restore as Draft' : 'Restore'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}

export default ArchivedSlotsManagement





