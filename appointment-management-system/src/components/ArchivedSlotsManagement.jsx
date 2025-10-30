import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ArchivedSlotsManagement = ({ onRefresh }) => {
  const { theme } = useTheme()
  const [archivedSlots, setArchivedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArchivedSlots()
  }, [])

  const fetchArchivedSlots = async () => {
    try {
      const response = await fetch('/api/admin/timeslots/archived', {
        credentials: 'include'
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

  const handleRestore = async (slotId) => {
    if (!window.confirm('Are you sure you want to restore this timeslot from archive?')) {
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
        fetchArchivedSlots()
        onRefresh()
      } else {
        setError('Failed to restore timeslot')
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
        </p>
        
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Date</th>
              <th style={thStyles}>Time</th>
              <th style={thStyles}>Capacity</th>
              <th style={thStyles}>Remaining</th>
              <th style={thStyles}>Archived Date</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {archivedSlots.map((slot) => (
              <tr key={slot.id}>
                <td style={tdStyles}>{formatDate(slot.date)}</td>
                <td style={tdStyles}>
                  {formatTime(slot.start)}
                  {slot.end && ` - ${formatTime(slot.end)}`}
                </td>
                <td style={tdStyles}>{slot.capacity}</td>
                <td style={tdStyles}>{slot.remaining || slot.capacity}</td>
                <td style={tdStyles}>{formatDate(slot.updatedAt)}</td>
                <td style={tdStyles}>
                  <button 
                    style={buttonStyles}
                    onClick={() => handleRestore(slot.id)}
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {archivedSlots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
            No archived slots found.
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchivedSlotsManagement





