/**
 * CommentThread component for displaying and adding comments to ideas
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ideasService } from '../api/ideasService';
import { Comment } from '../types';

interface CommentThreadProps {
  ideaId: string;
  canComment: boolean;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ ideaId, canComment }) => {
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await ideasService.getComments(ideaId);
      setComments(response.comments);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch comments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [ideaId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCommentText.trim()) {
      setError('Comment text is required');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await ideasService.createComment(ideaId, userId, newCommentText.trim());
      setNewCommentText('');
      // Refresh comments after adding new one
      await fetchComments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to add comment';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="comment-thread" style={{ marginTop: '2rem' }}>
      <h3>Comments</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="comments-list" style={{ marginBottom: '1rem' }}>
        {comments.length === 0 ? (
          <p style={{ color: '#666' }}>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.commentId}
              className="comment"
              style={{
                border: '1px solid #e0e0e0',
                padding: '1rem',
                marginBottom: '0.5rem',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                <strong>Author ID:</strong> {comment.authorId} | {formatDate(comment.createdAt)}
              </div>
              <div>{comment.text}</div>
            </div>
          ))
        )}
      </div>

      {canComment && (
        <form onSubmit={handleSubmitComment}>
          <h4>Add Comment</h4>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write your comment here..."
            rows={4}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isSubmitting || !newCommentText.trim() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              cursor: isSubmitting || !newCommentText.trim() ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Add Comment'}
          </button>
        </form>
      )}
    </div>
  );
};
