import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const AdminUserManagement = () => {
  const { theme } = useTheme()
  const { canManageUsers, canCreateAdmins, canCreateSuperAdmins, canCreateCheckinUsers, canCreateReportingUsers, checkAuthStatus } = useAuth()
  
  // Debug logging
  console.log('AdminUserManagement - Permission checks:', {
    canManageUsers,
    canCreateAdmins,
    canCreateSuperAdmins,
    canCreateCheckinUsers,
    canCreateReportingUsers
  })
  
  // Additional debug logging for user data
  const { user } = useAuth()
  console.log('AdminUserManagement - User data:', {
    userRole: user?.role,
    userRoles: user?.roles,
    userPermissions: user?.permissions,
    roleDetails: user?.roleDetails
  })
  
  const [adminUsers, setAdminUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roles: ['admin'] // Changed to array for multiple roles
  })
  const [availableRoles, setAvailableRoles] = useState([])
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [adminsRes, logsRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/audit-logs', { credentials: 'include' }),
        fetch('/api/admin/roles', { credentials: 'include' })
      ])

      if (adminsRes.ok) {
        const admins = await adminsRes.json()
        console.log('Fetched admin users:', admins)
        setAdminUsers(admins)
      } else {
        console.error('Failed to fetch admin users:', adminsRes.status)
      }

      if (logsRes.ok) {
        const logs = await logsRes.json()
        console.log('Fetched audit logs:', logs)
        setAuditLogs(logs)
      } else {
        console.error('Failed to fetch audit logs:', logsRes.status)
      }

      if (rolesRes.ok) {
        const roles = await rolesRes.json()
        console.log('Fetched available roles:', roles)
        setAvailableRoles(roles)
      } else {
        console.error('Failed to fetch roles:', rolesRes.status)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (roleName, checked) => {
    setFormData(prev => {
      if (checked) {
        // Add role if not already present
        if (!prev.roles.includes(roleName)) {
          return { ...prev, roles: [...prev.roles, roleName] }
        }
      } else {
        // Remove role
        return { ...prev, roles: prev.roles.filter(role => role !== roleName) }
      }
      return prev
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          roles: ['admin']
        })
        setShowCreateForm(false)
        setEditingUser(null)
        fetchData() // Refresh the data
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${editingUser ? 'update' : 'create'} admin user`)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Don't pre-fill password
      roles: user.userRoles ? user.userRoles.map(ur => ur.role.name) : [user.role || 'admin']
    })
    setShowCreateForm(true)
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      roles: ['admin']
    })
  }

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (response.ok) {
        fetchData() // Refresh the data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update admin user')
      }
    } catch (err) {
      setError('Network error')
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

  const inputStyles = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  }

  const buttonStyles = {
    backgroundColor: theme.primaryColor,
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    opacity: 1
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

  if (loading && adminUsers.length === 0) {
    return (
      <div style={cardStyles}>
        <p>Loading admin users...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={cardStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: theme.primaryColor, margin: 0 }}>
            Admin User Management
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={fetchData}
              style={{
                ...buttonStyles,
                backgroundColor: '#3B82F6',
                borderColor: '#3B82F6'
              }}
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => {
                console.log('Refreshing user permissions...')
                checkAuthStatus()
              }}
              style={{
                ...buttonStyles,
                backgroundColor: '#10B981',
                borderColor: '#10B981'
              }}
            >
              🔄 Refresh Permissions
            </button>
            {canManageUsers && (
              <button
                style={buttonStyles}
                onClick={() => showCreateForm ? handleCancel() : setShowCreateForm(true)}
              >
                {showCreateForm ? 'Cancel' : '+ Add New User'}
              </button>
            )}
          </div>
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

        {/* Role Capabilities Information */}
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#F8FAFC', 
          borderRadius: '6px',
          border: '1px solid #E2E8F0'
        }}>
          <h4 style={{ color: theme.primaryColor, marginBottom: '0.5rem', fontSize: '1rem' }}>
            Role Capabilities
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#7C3AED', color: 'white', borderRadius: '4px' }}>
              <strong>Super Admin:</strong> Full system access, create all user types, manage everything
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: theme.primaryColor, color: 'white', borderRadius: '4px' }}>
              <strong>Admin:</strong> Customer management, create admins & checkin users, assign roles
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#F59E0B', color: 'white', borderRadius: '4px' }}>
              <strong>CheckIn User:</strong> View bookings, check-in attendees, limited access
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: '#10B981', color: 'white', borderRadius: '4px' }}>
              <strong>Reporting:</strong> Generate reports, view analytics (coming soon)
            </div>
          </div>
        </div>

        {showCreateForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: theme.backgroundColor, borderRadius: '6px' }}>
            <h4 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
              {editingUser ? 'Edit User' : 'Create New User'}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={inputStyles}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Email Address *
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyles}
                  placeholder="555-123-4567"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={inputStyles}
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: theme.textColor
                }}>
                  Roles *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {availableRoles.filter(role => {
                    // Filter roles based on user permissions
                    const canCreate = (() => {
                      if (role.name === 'super_admin') return canCreateSuperAdmins
                      if (role.name === 'admin') {
                        // Force Admin role to be visible for Admin users as a workaround
                        const isAdminUser = user?.role === 'admin' || user?.roles?.includes('admin')
                        return canCreateAdmins || isAdminUser
                      }
                      if (role.name === 'checkin_user') return canCreateCheckinUsers
                      if (role.name === 'reporting') return canCreateReportingUsers
                      return false
                    })()
                    
                    console.log(`Role ${role.name}: canCreate = ${canCreate} (canCreateAdmins: ${canCreateAdmins}, isAdminUser: ${user?.role === 'admin' || user?.roles?.includes('admin')})`)
                    return canCreate
                  }).map((role) => (
                    <label key={role.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: formData.roles.includes(role.name) ? `2px solid ${theme.primaryColor}` : '2px solid transparent'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.name)}
                        onChange={(e) => handleRoleChange(role.name, e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {role.displayName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                          {role.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.roles.length === 0 && (
                  <div style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    At least one role must be selected
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyles,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '1rem'
              }}
            >
              {loading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
            </button>
          </form>
        )}

        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Name</th>
              <th style={thStyles}>Email</th>
              <th style={thStyles}>Phone</th>
              <th style={thStyles}>Role</th>
              <th style={thStyles}>Status</th>
              <th style={thStyles}>Created By</th>
              <th style={thStyles}>Created At</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.id}>
                <td style={tdStyles}>{user.name}</td>
                <td style={tdStyles}>{user.email}</td>
                <td style={tdStyles}>{user.phone || 'N/A'}</td>
                <td style={tdStyles}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {user.userRoles && user.userRoles.length > 0 ? (
                      user.userRoles.map((userRole) => {
                        const role = userRole.role
                        const getRoleStyle = (roleName) => {
                          switch (roleName) {
                            case 'super_admin':
                              return { backgroundColor: '#7C3AED', color: 'white', label: 'Super Admin' }
                            case 'admin':
                              return { backgroundColor: theme.primaryColor, color: 'white', label: 'Admin' }
                            case 'checkin_user':
                              return { backgroundColor: '#F59E0B', color: 'white', label: 'CheckIn User' }
                            case 'reporting':
                              return { backgroundColor: '#10B981', color: 'white', label: 'Reporting' }
                            default:
                              return { backgroundColor: '#6B7280', color: 'white', label: roleName }
                          }
                        }
                        
                        const roleStyle = getRoleStyle(role.name)
                        
                        return (
                          <span key={role.id} style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            backgroundColor: roleStyle.backgroundColor,
                            color: roleStyle.color
                          }}>
                            {roleStyle.label}
                          </span>
                        )
                      })
                    ) : (
                      // Fallback to legacy role field
                      (() => {
                        const getRoleStyle = (role) => {
                          switch (role) {
                            case 'super_admin':
                              return { backgroundColor: '#7C3AED', color: 'white', label: 'Super Admin' }
                            case 'admin':
                              return { backgroundColor: theme.primaryColor, color: 'white', label: 'Admin' }
                            case 'checkin_user':
                              return { backgroundColor: '#F59E0B', color: 'white', label: 'CheckIn User' }
                            case 'reporting':
                              return { backgroundColor: '#10B981', color: 'white', label: 'Reporting' }
                            default:
                              return { backgroundColor: '#6B7280', color: 'white', label: role }
                          }
                        }
                        
                        const roleStyle = getRoleStyle(user.role)
                        
                        return (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            backgroundColor: roleStyle.backgroundColor,
                            color: roleStyle.color
                          }}>
                            {roleStyle.label}
                          </span>
                        )
                      })()
                    )}
                  </div>
                </td>
                <td style={tdStyles}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    backgroundColor: user.active ? '#D1FAE5' : '#FEE2E2',
                    color: user.active ? '#065F46' : '#DC2626'
                  }}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyles}>{user.createdByUser?.name || 'System'}</td>
                <td style={tdStyles}>{formatDate(user.createdAt)}</td>
                <td style={tdStyles}>
                  {canManageUsers ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          backgroundColor: user.active ? '#EF4444' : '#10B981',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                        onClick={() => handleToggleActive(user.id, user.active)}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>No permissions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {adminUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.textColor }}>
            No admin users found.
          </div>
        )}
      </div>

      {/* Audit Log Section */}
      <div style={cardStyles}>
        <h3 style={{ color: theme.primaryColor, marginBottom: '1rem' }}>
          Audit Log
        </h3>
        
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
      </div>
    </div>
  )
}

export default AdminUserManagement
