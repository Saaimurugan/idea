/**
 * Tests for authentication endpoint (POST /auth/login)
 * 
 * Validates Requirements 1.1 and 1.2:
 * - User provides valid credentials, System SHALL authenticate and return session token
 * - User provides invalid credentials, System SHALL reject and return error message
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../index';
import * as db from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types';

// Mock the database module
jest.mock('../db');

describe('POST /auth/login', () => {
  const mockUser: User = {
    userId: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '', // Will be set in beforeEach
    role: 'Employee',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Hash a known password for testing
    mockUser.passwordHash = await bcrypt.hash('password123', 10);
  });

  /**
   * Helper function to create a login request event
   */
  function createLoginEvent(body: any): APIGatewayProxyEvent {
    return {
      httpMethod: 'POST',
      path: '/auth/login',
      body: JSON.stringify(body),
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };
  }

  describe('Valid credentials - Requirement 1.1', () => {
    it('should authenticate user with valid username and password', async () => {
      // Mock database to return user
      (db.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const event = createLoginEvent({
        username: 'testuser',
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      // Should return token, userId, and role
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('userId', mockUser.userId);
      expect(body).toHaveProperty('role', mockUser.role);
      
      // Token should be a valid JWT
      expect(typeof body.token).toBe('string');
      expect(body.token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should return a valid JWT token that can be decoded', async () => {
      (db.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const event = createLoginEvent({
        username: 'testuser',
        password: 'password123'
      });

      const response = await handler(event);
      const body = JSON.parse(response.body);

      // Decode token without verification (just to check structure)
      const decoded = jwt.decode(body.token) as any;
      
      expect(decoded).toHaveProperty('userId', mockUser.userId);
      expect(decoded).toHaveProperty('username', mockUser.username);
      expect(decoded).toHaveProperty('role', mockUser.role);
    });

    it('should authenticate users with different roles', async () => {
      const roles = ['Employee', 'Reviewer', 'Implementer', 'Admin'] as const;

      for (const role of roles) {
        const userWithRole = { ...mockUser, role };
        (db.getUserByUsername as jest.Mock).mockResolvedValue(userWithRole);

        const event = createLoginEvent({
          username: 'testuser',
          password: 'password123'
        });

        const response = await handler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.role).toBe(role);
      }
    });
  });

  describe('Invalid credentials - Requirement 1.2', () => {
    it('should reject authentication with non-existent username', async () => {
      // Mock database to return null (user not found)
      (db.getUserByUsername as jest.Mock).mockResolvedValue(null);

      const event = createLoginEvent({
        username: 'nonexistent',
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(body.error).toHaveProperty('message', 'Invalid username or password');
    });

    it('should reject authentication with incorrect password', async () => {
      (db.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const event = createLoginEvent({
        username: 'testuser',
        password: 'wrongpassword'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(body.error).toHaveProperty('message', 'Invalid username or password');
    });

    it('should reject authentication with missing username', async () => {
      const event = createLoginEvent({
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(body.error.message).toContain('Username');
    });

    it('should reject authentication with missing password', async () => {
      const event = createLoginEvent({
        username: 'testuser'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(body.error.message).toContain('Password');
    });

    it('should reject authentication with empty username', async () => {
      const event = createLoginEvent({
        username: '',
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject authentication with empty password', async () => {
      const event = createLoginEvent({
        username: 'testuser',
        password: ''
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject authentication with invalid JSON', async () => {
      const event = createLoginEvent({
        username: 'testuser',
        password: 'password123'
      });
      event.body = 'invalid json{';

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'INVALID_JSON');
    });

    it('should reject authentication with non-string username', async () => {
      const event = createLoginEvent({
        username: 12345,
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject authentication with non-string password', async () => {
      const event = createLoginEvent({
        username: 'testuser',
        password: 12345
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      (db.getUserByUsername as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const event = createLoginEvent({
        username: 'testuser',
        password: 'password123'
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      
      expect(body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });

  describe('Security considerations', () => {
    it('should not reveal whether username or password was incorrect', async () => {
      // Test with non-existent user
      (db.getUserByUsername as jest.Mock).mockResolvedValue(null);
      const event1 = createLoginEvent({
        username: 'nonexistent',
        password: 'password123'
      });
      const response1 = await handler(event1);
      const body1 = JSON.parse(response1.body);

      // Test with wrong password
      (db.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
      const event2 = createLoginEvent({
        username: 'testuser',
        password: 'wrongpassword'
      });
      const response2 = await handler(event2);
      const body2 = JSON.parse(response2.body);

      // Both should return the same error message
      expect(body1.error.message).toBe(body2.error.message);
      expect(body1.error.code).toBe(body2.error.code);
    });

    it('should not include password hash in any response', async () => {
      (db.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      const event = createLoginEvent({
        username: 'testuser',
        password: 'password123'
      });

      const response = await handler(event);
      const responseBody = response.body;

      // Response should not contain password hash
      expect(responseBody).not.toContain('passwordHash');
      expect(responseBody).not.toContain(mockUser.passwordHash);
    });
  });
});
