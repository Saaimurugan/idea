/**
 * Unit tests for user creation endpoint
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../index';
import * as db from '../db';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

// Mock the database module
jest.mock('../db');
const mockGetUserByUsername = db.getUserByUsername as jest.MockedFunction<typeof db.getUserByUsername>;
const mockCreateUser = db.createUser as jest.MockedFunction<typeof db.createUser>;

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('POST /users - Create User', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBcryptHash.mockResolvedValue('hashed_password' as never);
  });

  /**
   * Helper to generate admin token for tests
   */
  const generateAdminToken = (): string => {
    const payload: TokenPayload = {
      userId: 'admin-123',
      username: 'adminuser',
      role: 'Admin'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const createEvent = (body: any, includeAuth: boolean = true): APIGatewayProxyEvent => ({
    httpMethod: 'POST',
    path: '/users',
    body: JSON.stringify(body),
    headers: includeAuth ? { Authorization: `Bearer ${generateAdminToken()}` } : {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  test('should create user with valid data', async () => {
    mockGetUserByUsername.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue();

    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('userId');
    expect(typeof body.userId).toBe('string');
    expect(body.userId.length).toBeGreaterThan(0);
    
    expect(mockGetUserByUsername).toHaveBeenCalledWith('testuser');
    expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);
    expect(mockCreateUser).toHaveBeenCalled();
  });

  test('should return error for duplicate username', async () => {
    mockGetUserByUsername.mockResolvedValue({
      userId: 'existing-id',
      username: 'testuser',
      email: 'existing@example.com',
      passwordHash: 'hash',
      role: 'Employee',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });

    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(409);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('DUPLICATE_USERNAME');
    expect(body.error.message).toContain('username already exists');
    
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('should return validation error for missing username', async () => {
    const event = createEvent({
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Username');
    
    expect(mockGetUserByUsername).not.toHaveBeenCalled();
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('should return validation error for missing email', async () => {
    const event = createEvent({
      username: 'testuser',
      password: 'password123',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Email');
  });

  test('should return validation error for invalid email format', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('valid email');
  });

  test('should return validation error for missing password', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Password');
  });

  test('should return validation error for short password', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'short',
      role: 'Employee'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('at least 8 characters');
  });

  test('should return validation error for missing role', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Role');
  });

  test('should return validation error for invalid role', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'InvalidRole'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Role must be one of');
  });

  test('should accept all valid roles', async () => {
    mockGetUserByUsername.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue();

    const roles = ['Employee', 'Reviewer', 'Implementer', 'Admin'];

    for (const role of roles) {
      const event = createEvent({
        username: `user_${role}`,
        email: `${role}@example.com`,
        password: 'password123',
        role
      });

      const result = await handler(event);
      expect(result.statusCode).toBe(201);
    }
  });

  test('should return error for invalid JSON', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      path: '/users',
      body: 'invalid json',
      headers: { Authorization: `Bearer ${generateAdminToken()}` },
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  test('should require Admin role for user creation', async () => {
    // Create token with Employee role
    const employeePayload: TokenPayload = {
      userId: 'employee-123',
      username: 'employeeuser',
      role: 'Employee'
    };
    const employeeToken = jwt.sign(employeePayload, JWT_SECRET, { expiresIn: '1h' });

    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    }, false);
    event.headers = { Authorization: `Bearer ${employeeToken}` };

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('should return 401 when no authentication token provided', async () => {
    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    }, false);

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('should hash password before storage', async () => {
    mockGetUserByUsername.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue();

    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'mypassword123',
      role: 'Employee'
    });

    await handler(event);

    expect(mockBcryptHash).toHaveBeenCalledWith('mypassword123', 10);
    
    const createUserCall = mockCreateUser.mock.calls[0][0];
    expect(createUserCall.passwordHash).toBe('hashed_password');
    expect(createUserCall.passwordHash).not.toBe('mypassword123');
  });

  test('should set timestamps on user creation', async () => {
    mockGetUserByUsername.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue();

    const event = createEvent({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'Employee'
    });

    await handler(event);

    const createUserCall = mockCreateUser.mock.calls[0][0];
    expect(createUserCall.createdAt).toBeDefined();
    expect(createUserCall.updatedAt).toBeDefined();
    expect(createUserCall.createdAt).toBe(createUserCall.updatedAt);
  });
});
