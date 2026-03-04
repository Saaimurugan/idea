/**
 * Authorization middleware for User Service
 * 
 * Provides JWT token validation and role-based access control.
 * 
 * Validates Requirement 1.3: System SHALL authorize access to features based on user's assigned role
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { UserRole, TokenPayload, ErrorResponse } from './types';

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
 * Authenticated user context extracted from token
 */
export interface AuthContext {
  userId: string;
  username: string;
  role: UserRole;
}

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
 * Validate JWT token and extract user information
 * 
 * @param event - API Gateway event
 * @returns AuthContext if token is valid, null otherwise
 */
export function validateToken(event: APIGatewayProxyEvent): AuthContext | null {
  try {
    // Extract Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return null;
    }
    
    // Check Bearer token format
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return null;
    }
    
    const token = match[1];
    
    // Get JWT secret from environment
    const secret: jwt.Secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    
    // Verify and decode token
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Validate required fields
    if (!decoded.userId || !decoded.username || !decoded.role) {
      return null;
    }
    
    // Return auth context
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
  } catch (error) {
    // Token verification failed (expired, invalid signature, etc.)
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * 
 * Returns 401 error if token is missing or invalid
 * 
 * @param event - API Gateway event
 * @returns AuthContext if authenticated, error response otherwise
 */
export function requireAuth(
  event: APIGatewayProxyEvent
): AuthContext | APIGatewayProxyResult {
  const authContext = validateToken(event);
  
  if (!authContext) {
    return errorResponse(
      401,
      'UNAUTHORIZED',
      'Authentication required. Please provide a valid token.'
    );
  }
  
  return authContext;
}

/**
 * Middleware to require specific role(s)
 * 
 * Returns 401 if not authenticated, 403 if insufficient permissions
 * 
 * @param event - API Gateway event
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns AuthContext if authorized, error response otherwise
 */
export function requireRole(
  event: APIGatewayProxyEvent,
  allowedRoles: UserRole[]
): AuthContext | APIGatewayProxyResult {
  // First check authentication
  const authResult = requireAuth(event);
  
  // If requireAuth returned an error response, return it
  if ('statusCode' in authResult) {
    return authResult;
  }
  
  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(authResult.role)) {
    return errorResponse(
      403,
      'FORBIDDEN',
      `Access denied. Required role: ${allowedRoles.join(' or ')}`
    );
  }
  
  return authResult;
}

/**
 * Check if auth result is an error response
 * 
 * Type guard to distinguish between AuthContext and error response
 */
export function isErrorResponse(
  result: AuthContext | APIGatewayProxyResult
): result is APIGatewayProxyResult {
  return 'statusCode' in result;
}
