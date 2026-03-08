/**
 * MyIdeas component for employees to view their submitted ideas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { Idea } from '../types';

export const MyIdeas: React.FC = () => {
  const { userId, role } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIdeas = async () => {
    if (!userId || !role) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const response = await ideasService.getIdeas(userId, role);
      setIdeas(response.ideas);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch ideas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [userId, role]);

  const handleIdeaClick = (ideaId: string) => {
    navigate(`/ideas/${ideaId}`);
  };

  const handleEdit = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    navigate(`/ideas/${ideaId}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this idea?')) {
      return;
    }

    setDeletingId(ideaId);
    setError(null);

    try {
      await ideasService.deleteIdea(ideaId);
      // Refresh the list
      await fetchIdeas();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to delete idea';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canEditOrDelete = (idea: Idea) => {
    return idea.status === 'Pending Review';
  };

  if (loading) {
    return <div>Loading your ideas...</div>;
  }

  if (error) {
    return (
      <div className="error-message" style={{ color: 'red' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="my-ideas">
      <h2>My Ideas</h2>
      
      {ideas.length === 0 ? (
        <p>You haven't submitted any ideas yet.</p>
      ) : (
        <div className="ideas-list">
          {ideas.map((idea) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>
                  <strong>Status:</strong> {idea.status}
                </span>
                <span>
                  <strong>Submitted:</strong> {formatDate(idea.createdAt)}
                </span>
              </div>
              
              {canEditOrDelete(idea) && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => handleEdit(e, idea.ideaId)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, idea.ideaId)}
                    disabled={deletingId === idea.ideaId}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: deletingId === idea.ideaId ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      cursor: deletingId === idea.ideaId ? 'not-allowed' : 'pointer',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {deletingId === idea.ideaId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
