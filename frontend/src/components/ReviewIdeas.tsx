/**
 * ReviewIdeas component for reviewers to view and manage ideas pending review
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { Idea } from '../types';

export const ReviewIdeas: React.FC = () => {
  const { userId, role } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 'Failed to fetch ideas';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId, role]);

  const handleIdeaClick = (ideaId: string) => {
    navigate(`/ideas/${ideaId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading ideas for review...</div>;
  }

  if (error) {
    return (
      <div className="error-message" style={{ color: 'red' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="review-ideas">
      <h2>Ideas for Review</h2>
      
      {ideas.length === 0 ? (
        <p>No ideas pending review at this time.</p>
      ) : (
        <div className="ideas-list">
          {ideas.map((idea) => (
            <div
              key={idea.ideaId}
              className="idea-card"
              style={{
                border: '1px solid #ddd',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '4px',
              }}
            >
              <h3>{idea.title}</h3>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                {idea.description}
              </p>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>Status:</strong> {idea.status}</div>
                <div><strong>Submitted:</strong> {formatDate(idea.createdAt)}</div>
                <div><strong>Submitter ID:</strong> {idea.submitterId}</div>
              </div>
              <button
                onClick={() => handleIdeaClick(idea.ideaId)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                Review & Assign
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
