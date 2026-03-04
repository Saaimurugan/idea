/**
 * API client for Lambda function calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { ErrorResponse } from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ErrorResponse>) => {
        // Handle network errors
        if (!error.response) {
          const networkError = {
            response: {
              data: {
                error: {
                  code: 'NETWORK_ERROR',
                  message: 'Network error. Please check your connection and try again.',
                },
              },
            },
          };
          return Promise.reject(networkError);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Clear auth and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
          const timeoutError = {
            response: {
              data: {
                error: {
                  code: 'TIMEOUT_ERROR',
                  message: 'Request timed out. Please try again.',
                },
              },
            },
          };
          return Promise.reject(timeoutError);
        }

        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
