/**
 * StatusUpdateControl component for implementers to update idea status
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { IdeaStatus } from '../types';

interface StatusUpdateControlProps {
  ideaId: string;
  currentStatus: IdeaStatus;
  onStatusUpdateSuccess?: () => void;
}

export const StatusUpdateControl: React.FC<StatusUpdateControlProps> = ({
  ideaId,
  currentStatus,
  onStatusUpdateSuccess,
}) => {
  const { userId, role } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<IdeaStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Status transitions allowed for implementers
  const allowedStatuses: IdeaStatus[] = [
    'Assigned',
    'In Progress',
    'Completed',
  ];

  const handleUpdateStatus = async () => {
    if (!userId || !role) {
      setError('User not authenticated');
      return;
    }

    if (selectedStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      await ideasService.updateStatus(ideaId, selectedStatus, userId, role);
      setSuccess(`Status updated to "${selectedStatus}" successfully!`);
      
      if (onStatusUpdateSuccess) {
        onStatusUpdateSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update status';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="status-update-control" style={{ marginTop: '1rem' }}>
      <h3>Update Status</h3>
      
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
        <div>
          <strong>Current Status:</strong> {currentStatus}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as IdeaStatus)}
          disabled={isUpdating}
          style={{ padding: '0.5rem', flex: 1 }}
        >
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          onClick={handleUpdateStatus}
          disabled={isUpdating || selectedStatus === currentStatus}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isUpdating || selectedStatus === currentStatus ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: isUpdating || selectedStatus === currentStatus ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
};
