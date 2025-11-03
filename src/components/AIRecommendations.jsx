/**
 * AI Recommendations Component
 * Displays AI-powered slot recommendations based on user's booking history
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AIRecommendations = ({ email, onSelectSlot }) => {
  const { theme } = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    if (email && email.includes('@')) {
      fetchRecommendations();
    }
  }, [email]);

  const fetchRecommendations = async () => {
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/slots/recommendations?email=${encodeURIComponent(email)}&_t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('AI Recommendations error:', err);
      setError('AI recommendations temporarily unavailable');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (!showRecommendations || !email || !email.includes('@')) {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        margin: '20px 0',
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: theme.background || '#f5f5f5',
        border: `1px solid ${theme.accent || '#ddd'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: `3px solid ${theme.primary || '#007bff'}`,
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Getting AI-powered recommendations...</span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div style={{
        margin: '20px 0',
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        color: '#856404'
      }}>
        <p style={{ margin: 0 }}>{error}</p>
        <button
          onClick={fetchRecommendations}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#ffc107',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, mins] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${mins || '00'} ${ampm}`;
  };

  return (
    <div style={{
      margin: '20px 0',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: theme.background || '#f9f9f9',
      border: `2px solid ${theme.accent || '#007bff'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{
          margin: 0,
          color: theme.primary || '#007bff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ✨ Recommended for You
        </h3>
        <button
          onClick={() => setShowRecommendations(false)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666'
          }}
          title="Hide recommendations"
        >
          ×
        </button>
      </div>

      <p style={{
        margin: '0 0 15px 0',
        color: '#666',
        fontSize: '14px'
      }}>
        Based on your booking history, here are the best slots for you:
      </p>

      <div style={{
        display: 'grid',
        gap: '15px'
      }}>
        {recommendations.map((slot, index) => (
          <div
            key={slot.id}
            onClick={() => onSelectSlot && onSelectSlot(slot)}
            style={{
              padding: '15px',
              borderRadius: '6px',
              backgroundColor: '#fff',
              border: `2px solid ${index === 0 ? theme.primary : '#ddd'}`,
              cursor: onSelectSlot ? 'pointer' : 'default',
              transition: 'all 0.2s',
              boxShadow: index === 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (onSelectSlot) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (onSelectSlot) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = index === 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none';
              }
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: theme.primary || '#007bff',
                  marginBottom: '4px'
                }}>
                  {formatDate(slot.date)} at {formatTime(slot.start)}
                </div>
                {slot.end && (
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    Until {formatTime(slot.end)}
                  </div>
                )}
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  {slot.remaining} of {slot.capacity} spots remaining
                </div>
              </div>
              {index === 0 && (
                <span style={{
                  background: theme.accent || '#28a745',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  BEST MATCH
                </span>
              )}
            </div>
            {slot.recommendationReason && (
              <div style={{
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#495057',
                fontStyle: 'italic',
                borderLeft: `3px solid ${theme.accent || '#007bff'}`
              }}>
                💡 {slot.recommendationReason}
              </div>
            )}
            {onSelectSlot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSlot(slot);
                }}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '10px',
                  background: theme.primary || '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Select This Slot
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;

