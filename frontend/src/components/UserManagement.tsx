/**
 * UserManagement component for admins to manage users
 */

import React, { useState, useEffect } from 'react';
import { userService } from '../api/userService';
import { User } from '../types';

interface UserManagementProps {
  onCreateUser?: () => void;
  onEditUser?: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onCreateUser, onEditUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.users);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);

    try {
      await userService.deleteUser(userId);
      // Refresh user list after deletion
      await fetchUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to delete user';
      setError(errorMessage);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>User Management</h2>
        <button
          onClick={onCreateUser}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Create User
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Role</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.username}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.role}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button
                    onClick={() => onEditUser && onEditUser(user)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginRight: '0.5rem',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.userId)}
                    disabled={deletingUserId === user.userId}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: deletingUserId === user.userId ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: deletingUserId === user.userId ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    {deletingUserId === user.userId ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
