/**
 * IdeaDetailPage - Full idea information with role-appropriate controls
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { Idea } from '../types';
import { AssignmentControl } from '../components/AssignmentControl';
import { ReviewerStatusControl } from '../components/ReviewerStatusControl';
import { StatusUpdateControl } from '../components/StatusUpdateControl';
import { CommentThread } from '../components/CommentThread';
import { ErrorDisplay } from '../components/ErrorDisplay';

export const IdeaDetailPage: React.FC = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { userId, role } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdea = async () => {
    if (!ideaId) {
      setError('Idea ID is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await ideasService.getIdeaById(ideaId);
      setIdea(response.idea);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch idea details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdea();
  }, [ideaId]);

  const handleRefresh = () => {
    setLoading(true);
    fetchIdea();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Determine if user can comment
  const canComment = () => {
    if (!idea || !userId || !role) return false;
    
    if (role === 'Admin' || role === 'Reviewer') return true;
    if (role === 'Implementer' && idea.assigneeId === userId) return true;
    
    return false;
  };

  // Determine if user can assign
  const canAssign = () => {
    return role === 'Reviewer' || role === 'Admin';
  };

  // Determine if user can update status as reviewer
  const canReviewerUpdateStatus = () => {
    return (role === 'Reviewer' || role === 'Admin') && 
           (idea?.status === 'Pending Review' || idea?.status === 'In Review');
  };

  // Determine if user can update status as implementer
  const canImplementerUpdateStatus = () => {
    if (!idea || !userId) return false;
    return role === 'Implementer' && idea.assigneeId === userId;
  };

  // Determine if admin can update any status
  const canAdminUpdateStatus = () => {
    return role === 'Admin';
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading idea details...</div>;
  }

  if (error || !idea) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorDisplay error={error || 'Idea not found'} />
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="idea-detail-page" style={{ padding: '2rem' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}
      >
        ← Back
      </button>

      <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '4px' }}>
        <h1>{idea.title}</h1>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{idea.description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <strong>Status:</strong> {idea.status}
          </div>
          <div>
            <strong>Submitter ID:</strong> {idea.submitterId}
          </div>
          {idea.assigneeId && (
            <div>
              <strong>Assignee ID:</strong> {idea.assigneeId}
            </div>
          )}
          <div>
            <strong>Created:</strong> {formatDate(idea.createdAt)}
          </div>
          <div>
            <strong>Last Updated:</strong> {formatDate(idea.updatedAt)}
          </div>
          {idea.rejectionReason && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Rejection Reason:</strong> {idea.rejectionReason}
            </div>
          )}
        </div>

        {/* Status History */}
        {idea.statusHistory && idea.statusHistory.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3>Status History</h3>
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '1rem' }}>
              {idea.statusHistory.map((change, index) => (
                <div key={index} style={{ marginBottom: '0.5rem' }}>
                  <strong>{change.status}</strong> - Changed by {change.changedBy} on {formatDate(change.changedAt)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role-appropriate controls */}
        {canAssign() && (
          <AssignmentControl
            ideaId={idea.ideaId}
            currentAssigneeId={idea.assigneeId}
            onAssignmentSuccess={handleRefresh}
          />
        )}

        {canReviewerUpdateStatus() && (
          <ReviewerStatusControl
            ideaId={idea.ideaId}
            onStatusUpdateSuccess={handleRefresh}
          />
        )}

        {(canImplementerUpdateStatus() || canAdminUpdateStatus()) && (
          <StatusUpdateControl
            ideaId={idea.ideaId}
            currentStatus={idea.status}
            onStatusUpdateSuccess={handleRefresh}
          />
        )}

        {/* Comment Thread */}
        <CommentThread ideaId={idea.ideaId} canComment={canComment()} />
      </div>
    </div>
  );
};
