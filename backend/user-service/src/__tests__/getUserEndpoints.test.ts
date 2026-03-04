/**
 * Tests for user retrieval endpoints
 * - GET /users (list all users or filter by role)
 * - GET /users/{userId} (get single user)
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../index';
import * as db from '../db';
import { User, TokenPayload } from '../types';
import * as jwt from 'jsonwebtoken';

// Mock the db module
jest.mock('../db');

const mockGetAllUsers = db.getAllUsers as jest.MockedFunction<typeof db.getAllUsers>;
const mockGetUsersByRole = db.getUsersByRole as jest.MockedFunction<typeof db.getUsersByRole>;
const mockGetUserById = db.getUserById as jest.MockedFunction<typeof db.getUserById>;

describe('GET /users - List users', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  const generateToken = (role: string): string => {
    const payload: TokenPayload = {
      userId: `${role.toLowerCase()}-id`,
      username: `${role.toLowerCase()}user`,
      role: role as any
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const mockUsers: User[] = [
    {
      userId: 'user-1',
      username: 'admin1',
      email: 'admin@example.com',
      passwordHash: 'hashed-password',
      role: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      userId: 'user-2',
      username: 'employee1',
      email: 'employee@example.com',
      passwordHash: 'hashed-password',
      role: 'Employee',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Admin can list all users', async () => {
    mockGetAllUsers.mockResolvedValue(mockUsers);

    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      },
      queryStringParameters: null
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.users).toHaveLength(2);
    expect(body.users[0]).not.toHaveProperty('passwordHash');
    expect(body.users[0].username).toBe('admin1');
    expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
  });

  test('Non-Admin cannot list all users', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Employee')}`
      },
      queryStringParameters: null
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockGetAllUsers).not.toHaveBeenCalled();
  });

  test('Reviewer can filter users by role', async () => {
    const implementers = mockUsers.filter(u => u.role === 'Implementer');
    mockGetUsersByRole.mockResolvedValue(implementers);

    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Reviewer')}`
      },
      queryStringParameters: {
        role: 'Implementer'
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(mockGetUsersByRole).toHaveBeenCalledWith('Implementer');
  });

  test('Admin can filter users by role', async () => {
    const employees = mockUsers.filter(u => u.role === 'Employee');
    mockGetUsersByRole.mockResolvedValue(employees);

    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      },
      queryStringParameters: {
        role: 'Employee'
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.users).toHaveLength(1);
    expect(body.users[0].role).toBe('Employee');
    expect(mockGetUsersByRole).toHaveBeenCalledWith('Employee');
  });

  test('Employee cannot filter users by role', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Employee')}`
      },
      queryStringParameters: {
        role: 'Implementer'
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockGetUsersByRole).not.toHaveBeenCalled();
  });

  test('Unauthenticated request is rejected', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {},
      queryStringParameters: null
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('Response excludes passwordHash', async () => {
    mockGetAllUsers.mockResolvedValue(mockUsers);

    const event = {
      httpMethod: 'GET',
      path: '/users',
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      },
      queryStringParameters: null
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    body.users.forEach((user: any) => {
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).toHaveProperty('userId');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
    });
  });
});

describe('GET /users/{userId} - Get single user', () => {
  const JWT_SECRET = 'test-secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  const generateToken = (role: string): string => {
    const payload: TokenPayload = {
      userId: `${role.toLowerCase()}-id`,
      username: `${role.toLowerCase()}user`,
      role: role as any
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  };

  const mockUser: User = {
    userId: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'Employee',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Authenticated user can get user by ID', async () => {
    mockGetUserById.mockResolvedValue(mockUser);

    const event = {
      httpMethod: 'GET',
      path: '/users/user-123',
      pathParameters: {
        userId: 'user-123'
      },
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.user.userId).toBe('user-123');
    expect(body.user.username).toBe('testuser');
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(mockGetUserById).toHaveBeenCalledWith('user-123');
  });

  test('Returns 404 when user not found', async () => {
    mockGetUserById.mockResolvedValue(null);

    const event = {
      httpMethod: 'GET',
      path: '/users/nonexistent',
      pathParameters: {
        userId: 'nonexistent'
      },
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('Unauthenticated request is rejected', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/users/user-123',
      pathParameters: {
        userId: 'user-123'
      },
      headers: {}
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('Response includes all required fields except passwordHash', async () => {
    mockGetUserById.mockResolvedValue(mockUser);

    const event = {
      httpMethod: 'GET',
      path: '/users/user-123',
      pathParameters: {
        userId: 'user-123'
      },
      headers: {
        Authorization: `Bearer ${generateToken('Admin')}`
      }
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.user).toHaveProperty('userId');
    expect(body.user).toHaveProperty('username');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('role');
    expect(body.user).toHaveProperty('createdAt');
    expect(body.user).toHaveProperty('updatedAt');
    expect(body.user).not.toHaveProperty('passwordHash');
  });
});
