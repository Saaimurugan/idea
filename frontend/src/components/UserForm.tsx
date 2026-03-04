/**
 * UserForm component for creating and editing users
 */

import React, { useState } from 'react';
import { userService } from '../api/userService';
import { User, UserRole } from '../types';

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const isEditMode = !!user;
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role || 'Employee');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles: UserRole[] = ['Employee', 'Reviewer', 'Implementer', 'Admin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!isEditMode && !username.trim()) {
      setError('Username is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isEditMode && !password) {
      setError('Password is required');
      return;
    }

    if (password && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && user) {
        // Update existing user
        const updates: any = { email: email.trim(), role };
        if (password) {
          updates.password = password;
        }
        await userService.updateUser(user.userId, updates);
        setSuccess('User updated successfully!');
      } else {
        // Create new user
        await userService.createUser({
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        });
        setSuccess('User created successfully!');
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('Employee');
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
        `Failed to ${isEditMode ? 'update' : 'create'} user`;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-form">
      <h2>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="username">
            Username <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={isSubmitting || isEditMode}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {isEditMode && (
            <small style={{ color: '#666' }}>Username cannot be changed</small>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">
            Email <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">
            Password {!isEditMode && <span style={{ color: 'red' }}>*</span>}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password (min 8 characters)'}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          <small style={{ color: '#666' }}>
            {isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
          </small>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="role">
            Role <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isSubmitting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
            }}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
