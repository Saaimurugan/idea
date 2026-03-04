/**
 * User Service API calls
 */

import { apiClient } from './client';
import { User, LoginRequest, LoginResponse } from '../types';

export const userService = {
  // Authentication
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // User Management
  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<{ userId: string }> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUsersByRole: async (role: string): Promise<{ users: User[] }> => {
    const response = await apiClient.get('/users', { params: { role } });
    return response.data;
  },

  getUserById: async (userId: string): Promise<{ user: User }> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (
    userId: string,
    updates: { email?: string; role?: string; password?: string }
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.put(`/users/${userId}`, updates);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};
