import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const AuditLogs = () => {
  const { theme } = useTheme()
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', { 
        credentials: 'include' 
      })

      if (response.ok) {
        const logs = await response.json()
        setAuditLogs(logs)
      } else {
        setError('Failed to load audit logs')
      }
    } catch (error) {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1rem'
  }

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
  }

  const thStyles = {
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 'bold',
    border: '1px solid #ddd'
  }

  const tdStyles = {
    padding: '0.75rem',
    border: '1px solid #ddd',
    backgroundColor: 'white'
  }

  if (loading) {
    return (
      <div style={cardStyles}>
        <p>Loading audit logs...</p>
      </div>
    )
  }

  return (
    <div style={cardStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: theme.primaryColor, margin: 0 }}>
          Audit Logs - Admin Actions
        </h3>
        <button
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
          onClick={fetchAuditLogs}
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
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <table style={tableStyles}>
        <thead>
          <tr>
            <th style={thStyles}>Action</th>
            <th style={thStyles}>Performed By</th>
            <th style={thStyles}>Details</th>
            <th style={thStyles}>Date/Time</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log) => {
            // Get action color based on action type
            const getActionColor = (action) => {
              if (action.includes('CREATE')) return '#10B981' // Green
              if (action.includes('UPDATE') || action.includes('PUBLISH') || action.includes('UNPUBLISH')) return '#3B82F6' // Blue
              if (action.includes('DELETE') || action.includes('ARCHIVE') || action.includes('DEACTIVATE')) return '#EF4444' // Red
              if (action.includes('ACTIVATE')) return '#10B981' // Green
              if (action.includes('CHECKIN')) return '#F59E0B' // Orange
              return '#6B7280' // Gray
            }

            const getActionIcon = (action) => {
              if (action.includes('CREATE')) return '➕'
              if (action.includes('UPDATE')) return '✏️'
              if (action.includes('DELETE')) return '🗑️'
              if (action.includes('PUBLISH')) return '📢'
              if (action.includes('UNPUBLISH')) return '🔇'
              if (action.includes('ARCHIVE')) return '📦'
              if (action.includes('ACTIVATE')) return '✅'
              if (action.includes('DEACTIVATE')) return '❌'
              if (action.includes('CHECKIN')) return '📋'
              return '📝'
            }

            return (
              <tr key={log.id}>
                <td style={tdStyles}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: getActionColor(log.action),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>{getActionIcon(log.action)}</span>
                    <span>{log.action.replace(/_/g, ' ')}</span>
                  </span>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontWeight: 'bold' }}>{log.user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{log.user?.email || ''}</div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {log.details}
                  </div>
                </td>
                <td style={tdStyles}>
                  <div style={{ fontSize: '0.9rem' }}>{formatDate(log.createdAt)}</div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {auditLogs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
          No audit logs found.
        </div>
      )}

      <div style={{
        backgroundColor: '#F3F4F6',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: theme.textColor
      }}>
        <strong>Total Logs: {auditLogs.length}</strong> - Showing all admin actions with timestamps
      </div>
    </div>
  )
}

export default AuditLogs





