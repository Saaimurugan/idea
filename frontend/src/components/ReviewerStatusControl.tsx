/**
 * ReviewerStatusControl component for reviewers to approve or reject ideas
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';

interface ReviewerStatusControlProps {
  ideaId: string;
  onStatusUpdateSuccess?: () => void;
}

export const ReviewerStatusControl: React.FC<ReviewerStatusControlProps> = ({
  ideaId,
  onStatusUpdateSuccess,
}) => {
  const { userId, role } = useAuth();
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    if (!userId || !role) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      await ideasService.updateStatus(ideaId, 'Approved', userId, role);
      setSuccess('Idea approved successfully!');
      
      if (onStatusUpdateSuccess) {
        onStatusUpdateSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to approve idea';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!userId || !role) {
      setError('User not authenticated');
      return;
    }

    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      await ideasService.updateStatus(ideaId, 'Rejected', userId, role, rejectionReason.trim());
      setSuccess('Idea rejected successfully!');
      setShowRejectForm(false);
      setRejectionReason('');
      
      if (onStatusUpdateSuccess) {
        onStatusUpdateSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reject idea';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="reviewer-status-control" style={{ marginTop: '1rem' }}>
      <h3>Review Actions</h3>
      
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={handleApprove}
          disabled={isUpdating}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isUpdating ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          Approve
        </button>

        <button
          onClick={() => setShowRejectForm(!showRejectForm)}
          disabled={isUpdating}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isUpdating ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          Reject
        </button>
      </div>

      {showRejectForm && (
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="rejectionReason">
            Rejection Reason <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection"
            rows={4}
            disabled={isUpdating}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
          <button
            onClick={handleReject}
            disabled={isUpdating || !rejectionReason.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isUpdating || !rejectionReason.trim() ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              cursor: isUpdating || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              marginTop: '0.5rem',
            }}
          >
            {isUpdating ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      )}
    </div>
  );
};
