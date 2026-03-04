/**
 * AssignmentControl component for reviewers to assign ideas to implementers
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import { ideasService } from '../api/ideasService';
import { User } from '../types';

interface AssignmentControlProps {
  ideaId: string;
  currentAssigneeId?: string;
  onAssignmentSuccess?: () => void;
}

export const AssignmentControl: React.FC<AssignmentControlProps> = ({
  ideaId,
  currentAssigneeId,
  onAssignmentSuccess,
}) => {
  const { userId } = useAuth();
  const [implementers, setImplementers] = useState<User[]>([]);
  const [selectedImplementerId, setSelectedImplementerId] = useState<string>(currentAssigneeId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchImplementers = async () => {
      try {
        const response = await userService.getUsersByRole('Implementer');
        setImplementers(response.users);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 'Failed to fetch implementers';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchImplementers();
  }, []);

  const handleAssign = async () => {
    if (!selectedImplementerId) {
      setError('Please select an implementer');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsAssigning(true);

    try {
      await ideasService.assignIdea(ideaId, selectedImplementerId, userId);
      setSuccess('Idea assigned successfully!');
      
      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to assign idea';
      setError(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return <div>Loading implementers...</div>;
  }

  return (
    <div className="assignment-control" style={{ marginTop: '1rem' }}>
      <h3>Assign to Implementer</h3>
      
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

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          value={selectedImplementerId}
          onChange={(e) => setSelectedImplementerId(e.target.value)}
          disabled={isAssigning || implementers.length === 0}
          style={{ padding: '0.5rem', flex: 1 }}
        >
          <option value="">Select an implementer</option>
          {implementers.map((implementer) => (
            <option key={implementer.userId} value={implementer.userId}>
              {implementer.username} ({implementer.email})
            </option>
          ))}
        </select>

        <button
          onClick={handleAssign}
          disabled={isAssigning || !selectedImplementerId}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isAssigning || !selectedImplementerId ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            cursor: isAssigning || !selectedImplementerId ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          {isAssigning ? 'Assigning...' : 'Assign'}
        </button>
      </div>

      {implementers.length === 0 && (
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          No implementers available. Please contact an administrator.
        </p>
      )}
    </div>
  );
};
