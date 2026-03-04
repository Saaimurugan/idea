/**
 * AdminDashboard - Dashboard for admins to manage users and view all ideas
 */

import React, { useState } from 'react';
import { AllIdeas } from '../components/AllIdeas';
import { UserManagement } from '../components/UserManagement';
import { UserForm } from '../components/UserForm';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'ideas' | 'users'>('ideas');

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleFormSuccess = () => {
    setShowUserForm(false);
    setEditingUser(undefined);
    // Trigger refresh by switching tabs
    setActiveTab('users');
  };

  const handleFormCancel = () => {
    setShowUserForm(false);
    setEditingUser(undefined);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('ideas')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'ideas' ? '#007bff' : 'transparent',
            color: activeTab === 'ideas' ? 'white' : '#007bff',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'ideas' ? '3px solid #007bff' : 'none',
            marginRight: '1rem',
          }}
        >
          All Ideas
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'users' ? '#007bff' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#007bff',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '3px solid #007bff' : 'none',
          }}
        >
          User Management
        </button>
      </div>

      {activeTab === 'ideas' && <AllIdeas />}
      
      {activeTab === 'users' && (
        <>
          {showUserForm ? (
            <UserForm
              user={editingUser}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          ) : (
            <UserManagement
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
            />
          )}
        </>
      )}
    </div>
  );
};
