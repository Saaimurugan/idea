/**
 * IdeaEditForm component for editing ideas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';

export const IdeaEditForm: React.FC = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!ideaId) {
        setError('Idea ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await ideasService.getIdeaById(ideaId);
        setTitle(response.idea.title);
        setDescription(response.idea.description);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || 'Failed to fetch idea';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [ideaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!ideaId) {
      setError('Idea ID is required');
      return;
    }

    setSubmitting(true);

    try {
      await ideasService.updateIdea(ideaId, {
        title: title.trim(),
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        // Navigate based on user role
        if (role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/employee');
        }
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update idea';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate based on user role
    if (role === 'Admin') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading idea...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Edit Idea</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#efe', borderRadius: '4px' }}>
          Idea updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Title <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter idea title"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your idea in detail"
            disabled={submitting}
            rows={8}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            {submitting ? 'Updating...' : 'Update Idea'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
