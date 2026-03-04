/**
 * Unit tests for user update and delete endpoints
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../index';
import * as db from '../db';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

// Mock the database module
jest.mock('../db');
const mockGetUserById = db.getUserById as jest.MockedFunction<typeof db.getUserById>;
const mockUpdateUser = db.updateUser as jest.MockedFunction<typeof db.updateUser>;
const mockDeleteUser = db.deleteUser as jest.MockedFunction<typeof db.deleteUser>;

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('PUT /users/{userId} - Update User', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBcryptHash.mockResolvedValue('new_hashed_password' as never);
  });

  const generateAdminToken = (): string => {
    const payload: TokenPayload = {
      userId: 'admin-123',
      username: 'adminuser',
      role: 'Admin'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const generateEmployeeToken = (): string => {
    const payload: TokenPayload = {
      userId: 'employee-123',
      username: 'employeeuser',
      role: 'Employee'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const createUpdateEvent = (userId: string, body: any, token: string): APIGatewayProxyEvent => ({
    httpMethod: 'PUT',
    path: `/users/${userId}`,
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` },
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: { userId },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  test('should update user email', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'old@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);
    mockUpdateUser.mockResolvedValue();

    const event = createUpdateEvent('user-123', { email: 'new@example.com' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    
    expect(mockGetUserById).toHaveBeenCalledWith('user-123');
    expect(mockUpdateUser).toHaveBeenCalled();
    const updateCall = mockUpdateUser.mock.calls[0];
    expect(updateCall[0]).toBe('user-123');
    expect(updateCall[1].email).toBe('new@example.com');
    expect(updateCall[1].updatedAt).toBeDefined();
  });

  test('should update user role', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);
    mockUpdateUser.mockResolvedValue();

    const event = createUpdateEvent('user-123', { role: 'Reviewer' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    
    const updateCall = mockUpdateUser.mock.calls[0];
    expect(updateCall[1].role).toBe('Reviewer');
  });

  test('should update user password', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'old_hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);
    mockUpdateUser.mockResolvedValue();

    const event = createUpdateEvent('user-123', { password: 'newpassword123' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10);
    
    const updateCall = mockUpdateUser.mock.calls[0];
    expect(updateCall[1].passwordHash).toBe('new_hashed_password');
  });

  test('should update multiple fields at once', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'old@example.com',
      passwordHash: 'old_hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);
    mockUpdateUser.mockResolvedValue();

    const event = createUpdateEvent('user-123', {
      email: 'new@example.com',
      role: 'Reviewer',
      password: 'newpassword123'
    }, generateAdminToken());
    
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    
    const updateCall = mockUpdateUser.mock.calls[0];
    expect(updateCall[1].email).toBe('new@example.com');
    expect(updateCall[1].role).toBe('Reviewer');
    expect(updateCall[1].passwordHash).toBe('new_hashed_password');
  });

  test('should return 404 for non-existent user', async () => {
    mockGetUserById.mockResolvedValue(null);

    const event = createUpdateEvent('nonexistent-id', { email: 'new@example.com' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should return validation error for invalid email', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);

    const event = createUpdateEvent('user-123', { email: 'invalid-email' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should return validation error for invalid role', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);

    const event = createUpdateEvent('user-123', { role: 'InvalidRole' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should return validation error for short password', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);

    const event = createUpdateEvent('user-123', { password: 'short' }, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should return validation error when no fields provided', async () => {
    const existingUser = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'Employee' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockGetUserById.mockResolvedValue(existingUser);

    const event = createUpdateEvent('user-123', {}, generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should require Admin role for user update', async () => {
    const event = createUpdateEvent('user-123', { email: 'new@example.com' }, generateEmployeeToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockGetUserById).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('should return 401 when no authentication token provided', async () => {
    const event = createUpdateEvent('user-123', { email: 'new@example.com' }, '');
    event.headers = {};

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

describe('DELETE /users/{userId} - Delete User', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const generateAdminToken = (): string => {
    const payload: TokenPayload = {
      userId: 'admin-123',
      username: 'adminuser',
      role: 'Admin'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const generateReviewerToken = (): string => {
    const payload: TokenPayload = {
      userId: 'reviewer-123',
      username: 'revieweruser',
      role: 'Reviewer'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const createDeleteEvent = (userId: string, token: string): APIGatewayProxyEvent => ({
    httpMethod: 'DELETE',
    path: `/users/${userId}`,
    body: null,
    headers: { Authorization: `Bearer ${token}` },
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: { userId },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  test('should delete user successfully', async () => {
    mockDeleteUser.mockResolvedValue();

    const event = createDeleteEvent('user-123', generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    
    expect(mockDeleteUser).toHaveBeenCalledWith('user-123');
  });

  test('should return 404 for non-existent user', async () => {
    const conditionalCheckError = new Error('ConditionalCheckFailedException');
    conditionalCheckError.name = 'ConditionalCheckFailedException';
    mockDeleteUser.mockRejectedValue(conditionalCheckError);

    const event = createDeleteEvent('nonexistent-id', generateAdminToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('should require Admin role for user deletion', async () => {
    const event = createDeleteEvent('user-123', generateReviewerToken());
    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  test('should return 401 when no authentication token provided', async () => {
    const event = createDeleteEvent('user-123', '');
    event.headers = {};

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  test('should return 400 when userId is missing', async () => {
    const event = createDeleteEvent('', generateAdminToken());
    event.pathParameters = null;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
