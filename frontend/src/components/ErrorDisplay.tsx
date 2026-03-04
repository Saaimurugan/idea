/**
 * ErrorDisplay component for displaying error messages from backend services
 */

import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  type = 'error',
  onDismiss 
}) => {
  if (!error) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#f8d7da';
      case 'warning':
        return '#fff3cd';
      case 'info':
        return '#d1ecf1';
      default:
        return '#f8d7da';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return '#721c24';
      case 'warning':
        return '#856404';
      case 'info':
        return '#0c5460';
      default:
        return '#721c24';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return '#f5c6cb';
      case 'warning':
        return '#ffeaa7';
      case 'info':
        return '#bee5eb';
      default:
        return '#f5c6cb';
    }
  };

  return (
    <div
      className={`error-display ${type}`}
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <strong>{type === 'error' ? 'Error: ' : type === 'warning' ? 'Warning: ' : 'Info: '}</strong>
        {error}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginLeft: '1rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: getTextColor(),
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
          }}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
};
