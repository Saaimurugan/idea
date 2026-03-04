/**
 * AllIdeas component for admins to view and manage all ideas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { Idea, IdeaStatus } from '../types';

export const AllIdeas: React.FC = () => {
  const { userId, role } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses: IdeaStatus[] = [
    'Pending Review',
    'In Review',
    'Assigned',
    'In Progress',
    'Completed',
    'Rejected',
  ];

  useEffect(() => {
    const fetchIdeas = async () => {
      if (!userId || !role) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await ideasService.getIdeas(userId, role);
        setIdeas(response.ideas);
        setFilteredIdeas(response.ideas);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 'Failed to fetch ideas';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId, role]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredIdeas(ideas);
    } else {
      setFilteredIdeas(ideas.filter((idea) => idea.status === statusFilter));
    }
  }, [statusFilter, ideas]);

  const handleIdeaClick = (ideaId: string) => {
    navigate(`/ideas/${ideaId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading all ideas...</div>;
  }

  if (error) {
    return (
      <div className="error-message" style={{ color: 'red' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="all-ideas">
      <h2>All Ideas</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="statusFilter" style={{ marginRight: '0.5rem' }}>
          Filter by Status:
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="all">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: '1rem', color: '#666' }}>
          Showing {filteredIdeas.length} of {ideas.length} ideas
        </span>
      </div>

      {filteredIdeas.length === 0 ? (
        <p>No ideas found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.</p>
      ) : (
        <div className="ideas-list">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.ideaId}
              className="idea-card"
              onClick={() => handleIdeaClick(idea.ideaId)}
              style={{
                border: '1px solid #ddd',
                padding: '1rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              <h3>{idea.title}</h3>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                {idea.description.substring(0, 150)}
                {idea.description.length > 150 ? '...' : ''}
              </p>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Status:</strong> {idea.status}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Submitter ID:</strong> {idea.submitterId}
                </div>
                {idea.assigneeId && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Assignee ID:</strong> {idea.assigneeId}
                  </div>
                )}
                <div>
                  <strong>Created:</strong> {formatDate(idea.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
