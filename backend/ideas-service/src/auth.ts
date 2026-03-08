/**
 * Authorization middleware for Ideas Service
 * 
 * Provides JWT token validation and role-based access control.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { UserRole, ErrorResponse } from './types';

/**
 * Token payload structure
 */
interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

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
