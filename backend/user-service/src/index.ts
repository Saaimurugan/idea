/**
 * User Service Lambda Function
 * 
 * Handles all user CRUD operations and authentication for the Employee Ideas Management System.
 * 
 * Endpoints:
 * - POST /auth/login - Authenticate user
 * - POST /users - Create user (Admin only)
 * - GET /users - List users (Admin/Reviewer)
 * - GET /users/{userId} - Get user by ID
 * - PUT /users/{userId} - Update user (Admin only)
 * - DELETE /users/{userId} - Delete user (Admin only)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, ErrorResponse, UserRole, LoginResponse, TokenPayload } from './types';
import { validateCreateUserRequest, validateUpdateUserRequest, validateLoginRequest, ValidationError } from './validation';
import { createUser, getUserByUsername, getAllUsers, getUsersByRole, getUserById, updateUser, deleteUser } from './db';
import { requireAuth, requireRole, isErrorResponse, AuthContext } from './auth';

/**
 * Common response headers
 */
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Create error response
 */
function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: any
): APIGatewayProxyResult {
  const response: ErrorResponse = {
    error: {
      code,
      message,
      details
    }
  };
  
  return {
    statusCode,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(response)
  };
}

/**
 * Create success response
 */
function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(data)
  };
}

/**
 * Remove passwordHash from user object for API responses
 */
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Generate JWT token for authenticated user
 */
function generateToken(payload: TokenPayload): string {
  const secret: jwt.Secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as any;
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Handle POST /auth/login - Authenticate user
 */
async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    validateLoginRequest(body);
    
    // Get user by username
    const user = await getUserByUsername(body.username);
    if (!user) {
      console.warn('Login attempt with invalid username:', body.username);
      return errorResponse(
        401,
        'INVALID_CREDENTIALS',
        'Invalid username or password'
      );
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatch) {
      console.warn('Login attempt with invalid password for user:', body.username);
      return errorResponse(
        401,
        'INVALID_CREDENTIALS',
        'Invalid username or password'
      );
    }
    
    // Generate session token
    const tokenPayload: TokenPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    const token = generateToken(tokenPayload);
    
    // Return success response
    const response: LoginResponse = {
      token,
      userId: user.userId,
      role: user.role
    };
    
    console.log('User logged in successfully:', user.userId);
    return successResponse(200, response);
    
  } catch (error: any) {
    // Safe username extraction for logging
    let username = 'unknown';
    try {
      if (event.body) {
        const parsed = JSON.parse(event.body);
        username = parsed.username || 'unknown';
      }
    } catch {
      // Ignore JSON parse errors in logging
    }
    
    console.error('Error during login:', {
      error: error.message,
      stack: error.stack,
      username
    });
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    // Check for DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during login');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during login');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Handle POST /users - Create new user
 */
async function handleCreateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Require Admin role
    const authResult = requireRole(event, ['Admin']);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    validateCreateUserRequest(body);
    
    // Check username uniqueness
    const existingUser = await getUserByUsername(body.username);
    if (existingUser) {
      console.warn('Attempt to create user with duplicate username:', body.username);
      return errorResponse(
        409,
        'DUPLICATE_USERNAME',
        'A user with this username already exists'
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);
    
    // Create user object
    const now = new Date().toISOString();
    const user: User = {
      userId: uuidv4(),
      username: body.username,
      email: body.email,
      passwordHash,
      role: body.role,
      createdAt: now,
      updatedAt: now
    };
    
    // Save to DynamoDB
    await createUser(user);
    
    console.log('User created successfully:', user.userId);
    // Return success with userId
    return successResponse(201, { userId: user.userId });
    
  } catch (error: any) {
    // Safe username extraction for logging
    let username = 'unknown';
    try {
      if (event.body) {
        const parsed = JSON.parse(event.body);
        username = parsed.username || 'unknown';
      }
    } catch {
      // Ignore JSON parse errors in logging
    }
    
    console.error('Error creating user:', {
      error: error.message,
      stack: error.stack,
      username
    });
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    // Check for DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      console.error('Conditional check failed during user creation');
      return errorResponse(409, 'CONFLICT', 'User already exists');
    }
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during user creation');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during user creation');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Handle GET /users - List all users or filter by role
 */
async function handleListUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Get role filter from query parameters
    const roleFilter = event.queryStringParameters?.role;
    
    // Authorization check
    let authResult: AuthContext | APIGatewayProxyResult;
    
    if (roleFilter) {
      // Reviewer can filter by role (specifically for Implementers)
      // Admin can filter by any role
      authResult = requireRole(event, ['Admin', 'Reviewer']);
    } else {
      // Listing all users requires Admin role
      authResult = requireRole(event, ['Admin']);
    }
    
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    
    // Fetch users
    let users: User[];
    if (roleFilter) {
      console.log('Fetching users with role filter:', roleFilter);
      users = await getUsersByRole(roleFilter);
    } else {
      console.log('Fetching all users');
      users = await getAllUsers();
    }
    
    // Remove passwordHash from responses
    const sanitizedUsers = users.map(sanitizeUser);
    
    console.log('Users retrieved successfully, count:', users.length);
    return successResponse(200, { users: sanitizedUsers });
    
  } catch (error: any) {
    console.error('Error listing users:', {
      error: error.message,
      stack: error.stack,
      roleFilter: event.queryStringParameters?.role
    });
    
    // Check for DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during user listing');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during user listing');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Handle GET /users/{userId} - Get single user by ID
 */
async function handleGetUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Require authentication
    const authResult = requireAuth(event);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    
    // Extract userId from path
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
    }
    
    // Fetch user
    const user = await getUserById(userId);
    if (!user) {
      console.warn('User not found:', userId);
      return errorResponse(404, 'NOT_FOUND', 'User not found');
    }
    
    // Remove passwordHash from response
    const sanitizedUser = sanitizeUser(user);
    
    console.log('User retrieved successfully:', userId);
    return successResponse(200, { user: sanitizedUser });
    
  } catch (error: any) {
    console.error('Error getting user:', {
      error: error.message,
      stack: error.stack,
      userId: event.pathParameters?.userId
    });
    
    // Check for DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during user retrieval');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during user retrieval');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Handle PUT /users/{userId} - Update user
 */
async function handleUpdateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Require Admin role
    const authResult = requireRole(event, ['Admin']);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    
    // Extract userId from path
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
    }
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    validateUpdateUserRequest(body);
    
    // Check if user exists
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      console.warn('Attempt to update non-existent user:', userId);
      return errorResponse(404, 'NOT_FOUND', 'User not found');
    }
    
    // Prepare updates
    const updates: Partial<Omit<User, 'userId' | 'createdAt'>> = {
      updatedAt: new Date().toISOString()
    };
    
    if (body.email !== undefined) {
      updates.email = body.email;
    }
    
    if (body.role !== undefined) {
      updates.role = body.role;
    }
    
    if (body.password !== undefined) {
      // Hash new password
      updates.passwordHash = await bcrypt.hash(body.password, 10);
    }
    
    // Update user in DynamoDB
    await updateUser(userId, updates);
    
    console.log('User updated successfully:', userId);
    return successResponse(200, { success: true });
    
  } catch (error: any) {
    console.error('Error updating user:', {
      error: error.message,
      stack: error.stack,
      userId: event.pathParameters?.userId
    });
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    // Check for DynamoDB errors
    if (error.name === 'ConditionalCheckFailedException') {
      console.error('User not found during update (conditional check failed):', event.pathParameters?.userId);
      return errorResponse(404, 'NOT_FOUND', 'User not found');
    }
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during user update');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during user update');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Handle DELETE /users/{userId} - Delete user
 */
async function handleDeleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Require Admin role
    const authResult = requireRole(event, ['Admin']);
    if (isErrorResponse(authResult)) {
      return authResult;
    }
    
    // Extract userId from path
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
    }
    
    // Delete user from DynamoDB
    // The deleteUser function will throw if user doesn't exist (ConditionExpression)
    try {
      await deleteUser(userId);
      console.log('User deleted successfully:', userId);
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.warn('Attempt to delete non-existent user:', userId);
        return errorResponse(404, 'NOT_FOUND', 'User not found');
      }
      throw error;
    }
    
    return successResponse(200, { success: true });
    
  } catch (error: any) {
    console.error('Error deleting user:', {
      error: error.message,
      stack: error.stack,
      userId: event.pathParameters?.userId
    });
    
    // Check for DynamoDB errors
    if (error.name === 'ResourceNotFoundException') {
      console.error('DynamoDB table not found during user deletion');
      return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
    }
    
    if (error.name === 'ProvisionedThroughputExceededException') {
      console.error('DynamoDB throughput exceeded during user deletion');
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
}

/**
 * Lambda handler function
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod } = event;
  // API Gateway v2 uses requestContext.http.method, v1 uses httpMethod
  const method = httpMethod || (event as any).requestContext?.http?.method;
  // Handle both path and rawPath (API Gateway v2 format)
  let path = event.path || (event as any).rawPath || '';
  
  // API Gateway v2 includes the stage in the path, v1 doesn't
  // Remove stage prefix if it exists (e.g., /prod/auth/login -> /auth/login)
  // But be careful not to remove the first segment if it's actually part of the route
  const pathSegments = path.split('/').filter((s: string) => s);
  if (pathSegments.length > 0 && pathSegments[0] === 'prod') {
    path = '/' + pathSegments.slice(1).join('/');
  }
  
  console.log('Request:', { method, httpMethod, originalPath: event.path, processedPath: path });
  
  try {
    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      return successResponse(200, {});
    }
    
    // Route to appropriate handler
    if (method === 'POST' && path === '/auth/login') {
      return await handleLogin(event);
    }
    
    if (method === 'POST' && path === '/users') {
      return await handleCreateUser(event);
    }
    
    if (method === 'GET' && path === '/users') {
      return await handleListUsers(event);
    }
    
    if (method === 'GET' && path.startsWith('/users/')) {
      return await handleGetUser(event);
    }
    
    if (method === 'PUT' && path.startsWith('/users/')) {
      return await handleUpdateUser(event);
    }
    
    if (method === 'DELETE' && path.startsWith('/users/')) {
      return await handleDeleteUser(event);
    }
    
    // Unknown route
    console.warn('Unknown route requested:', { method, path });
    return errorResponse(404, 'NOT_FOUND', 'Endpoint not found');
    
  } catch (error: any) {
    console.error('Unhandled error in Lambda handler:', {
      error: error.message,
      stack: error.stack,
      method,
      path
    });
    return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
  }
};
