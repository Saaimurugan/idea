/**
 * Ideas Service API calls
 */

import { apiClient } from './client';
import { Idea, Comment } from '../types';

export const ideasService = {
  // Idea Operations
  createIdea: async (ideaData: {
    title: string;
    description: string;
    submitterId: string;
  }): Promise<{ ideaId: string }> => {
    const response = await apiClient.post('/ideas', ideaData);
    return response.data;
  },

  getIdeas: async (userId: string, role: string): Promise<{ ideas: Idea[] }> => {
    const response = await apiClient.get('/ideas', { params: { userId, role } });
    return response.data;
  },

  getIdeaById: async (ideaId: string): Promise<{ idea: Idea }> => {
    const response = await apiClient.get(`/ideas/${ideaId}`);
    return response.data;
  },

  updateIdea: async (
    ideaId: string,
    updates: { title?: string; description?: string }
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put(`/ideas/${ideaId}`, updates);
    return response.data;
  },

  deleteIdea: async (ideaId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/ideas/${ideaId}`);
    return response.data;
  },

  assignIdea: async (
    ideaId: string,
    assigneeId: string,
    reviewerId: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put(`/ideas/${ideaId}/assign`, {
      assigneeId,
      reviewerId,
    });
    return response.data;
  },

  updateStatus: async (
    ideaId: string,
    status: string,
    userId: string,
    role: string,
    reason?: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put(`/ideas/${ideaId}/status`, {
      status,
      userId,
      role,
      reason,
    });
    return response.data;
  },

  // Comment Operations
  createComment: async (
    ideaId: string,
    userId: string,
    text: string
  ): Promise<{ commentId: string }> => {
    const response = await apiClient.post(`/ideas/${ideaId}/comments`, {
      userId,
      text,
    });
    return response.data;
  },

  getComments: async (ideaId: string): Promise<{ comments: Comment[] }> => {
    const response = await apiClient.get(`/ideas/${ideaId}/comments`);
    return response.data;
  },
};
