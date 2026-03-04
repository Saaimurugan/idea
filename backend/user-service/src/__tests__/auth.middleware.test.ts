/**
 * Tests for authorization middleware
 * 
 * Validates Requirement 1.3: System SHALL authorize access to features based on user's assigned role
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { validateToken, requireAuth, requireRole, isErrorResponse, AuthContext } from '../auth';
import { UserRole, TokenPayload } from '../types';

describe('Authorization Middleware', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  /**
   * Helper function to create a mock API Gateway event
   */
  function createMockEvent(authHeader?: string): APIGatewayProxyEvent {
    return {
      httpMethod: 'GET',
      path: '/test',
      body: null,
      headers: authHeader ? { Authorization: authHeader } : {},
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

  /**
   * Helper function to generate a valid JWT token
   */
  function generateTestToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  }

  describe('validateToken', () => {
    it('should validate and extract user info from valid token', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = validateToken(event);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      });
    });

    it('should validate tokens for all user roles', () => {
      const roles: UserRole[] = ['Employee', 'Reviewer', 'Implementer', 'Admin'];

      for (const role of roles) {
        const payload: TokenPayload = {
          userId: 'user-123',
          username: 'testuser',
          role
        };
        const token = generateTestToken(payload);
        const event = createMockEvent(`Bearer ${token}`);

        const result = validateToken(event);

        expect(result).not.toBeNull();
        expect(result?.role).toBe(role);
      }
    });

    it('should return null when Authorization header is missing', () => {
      const event = createMockEvent();

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null when Authorization header does not start with Bearer', () => {
      const event = createMockEvent('Basic sometoken');

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for invalid token format', () => {
      const event = createMockEvent('Bearer invalid-token');

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      // Create token that expires immediately
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
      const event = createMockEvent(`Bearer ${token}`);

      // Wait a bit to ensure expiration
      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for token with invalid signature', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      // Sign with different secret
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
      const event = createMockEvent(`Bearer ${token}`);

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for token missing userId', () => {
      const payload = {
        username: 'testuser',
        role: 'Employee'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      const event = createMockEvent(`Bearer ${token}`);

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for token missing username', () => {
      const payload = {
        userId: 'user-123',
        role: 'Employee'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      const event = createMockEvent(`Bearer ${token}`);

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should return null for token missing role', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      const event = createMockEvent(`Bearer ${token}`);

      const result = validateToken(event);

      expect(result).toBeNull();
    });

    it('should handle lowercase authorization header', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent();
      event.headers = { authorization: `Bearer ${token}` };

      const result = validateToken(event);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
    });
  });

  describe('requireAuth', () => {
    it('should return AuthContext for valid token', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireAuth(event);

      expect(isErrorResponse(result)).toBe(false);
      if (!isErrorResponse(result)) {
        expect(result.userId).toBe('user-123');
        expect(result.username).toBe('testuser');
        expect(result.role).toBe('Employee');
      }
    });

    it('should return 401 error for missing token', () => {
      const event = createMockEvent();

      const result = requireAuth(event);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(401);
        const body = JSON.parse(result.body);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(body.error.message).toContain('Authentication required');
      }
    });

    it('should return 401 error for invalid token', () => {
      const event = createMockEvent('Bearer invalid-token');

      const result = requireAuth(event);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(401);
        const body = JSON.parse(result.body);
        expect(body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should return 401 error for expired token', () => {
      const payload: TokenPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireAuth(event);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(401);
      }
    });
  });

  describe('requireRole - Requirement 1.3', () => {
    it('should allow access when user has required role', () => {
      const payload: TokenPayload = {
        userId: 'admin-123',
        username: 'adminuser',
        role: 'Admin'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(false);
      if (!isErrorResponse(result)) {
        expect(result.role).toBe('Admin');
      }
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      const payload: TokenPayload = {
        userId: 'reviewer-123',
        username: 'revieweruser',
        role: 'Reviewer'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireRole(event, ['Admin', 'Reviewer']);

      expect(isErrorResponse(result)).toBe(false);
      if (!isErrorResponse(result)) {
        expect(result.role).toBe('Reviewer');
      }
    });

    it('should return 403 error when user does not have required role', () => {
      const payload: TokenPayload = {
        userId: 'employee-123',
        username: 'employeeuser',
        role: 'Employee'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(403);
        const body = JSON.parse(result.body);
        expect(body.error.code).toBe('FORBIDDEN');
        expect(body.error.message).toContain('Access denied');
      }
    });

    it('should return 403 when Employee tries to access Admin-only resource', () => {
      const payload: TokenPayload = {
        userId: 'employee-123',
        username: 'employeeuser',
        role: 'Employee'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(403);
      }
    });

    it('should return 403 when Reviewer tries to access Admin-only resource', () => {
      const payload: TokenPayload = {
        userId: 'reviewer-123',
        username: 'revieweruser',
        role: 'Reviewer'
      };
      const token = generateTestToken(payload);
      const event = createMockEvent(`Bearer ${token}`);

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(403);
      }
    });

    it('should return 401 error when token is missing (before checking role)', () => {
      const event = createMockEvent();

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(401);
        const body = JSON.parse(result.body);
        expect(body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should return 401 error when token is invalid (before checking role)', () => {
      const event = createMockEvent('Bearer invalid-token');

      const result = requireRole(event, ['Admin']);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(401);
      }
    });

    it('should handle all role combinations correctly', () => {
      const testCases: Array<{
        userRole: UserRole;
        allowedRoles: UserRole[];
        shouldAllow: boolean;
      }> = [
        { userRole: 'Admin', allowedRoles: ['Admin'], shouldAllow: true },
        { userRole: 'Admin', allowedRoles: ['Reviewer'], shouldAllow: false },
        { userRole: 'Admin', allowedRoles: ['Admin', 'Reviewer'], shouldAllow: true },
        { userRole: 'Reviewer', allowedRoles: ['Admin', 'Reviewer'], shouldAllow: true },
        { userRole: 'Reviewer', allowedRoles: ['Admin'], shouldAllow: false },
        { userRole: 'Employee', allowedRoles: ['Admin', 'Reviewer'], shouldAllow: false },
        { userRole: 'Implementer', allowedRoles: ['Implementer'], shouldAllow: true },
        { userRole: 'Implementer', allowedRoles: ['Admin', 'Implementer'], shouldAllow: true },
      ];

      for (const testCase of testCases) {
        const payload: TokenPayload = {
          userId: 'user-123',
          username: 'testuser',
          role: testCase.userRole
        };
        const token = generateTestToken(payload);
        const event = createMockEvent(`Bearer ${token}`);

        const result = requireRole(event, testCase.allowedRoles);

        if (testCase.shouldAllow) {
          expect(isErrorResponse(result)).toBe(false);
        } else {
          expect(isErrorResponse(result)).toBe(true);
          if (isErrorResponse(result)) {
            expect(result.statusCode).toBe(403);
          }
        }
      }
    });
  });

  describe('isErrorResponse type guard', () => {
    it('should return true for error response', () => {
      const errorResponse = {
        statusCode: 401,
        headers: {},
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Test' } })
      };

      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it('should return false for AuthContext', () => {
      const authContext: AuthContext = {
        userId: 'user-123',
        username: 'testuser',
        role: 'Employee'
      };

      expect(isErrorResponse(authContext)).toBe(false);
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in error responses', () => {
      const event = createMockEvent();

      const result = requireAuth(event);

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
        expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
        expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      }
    });
  });
});
