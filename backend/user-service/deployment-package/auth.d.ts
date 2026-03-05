/**
 * Authorization middleware for User Service
 *
 * Provides JWT token validation and role-based access control.
 *
 * Validates Requirement 1.3: System SHALL authorize access to features based on user's assigned role
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRole } from './types';
/**
 * Authenticated user context extracted from token
 */
export interface AuthContext {
    userId: string;
    username: string;
    role: UserRole;
}
/**
 * Validate JWT token and extract user information
 *
 * @param event - API Gateway event
 * @returns AuthContext if token is valid, null otherwise
 */
export declare function validateToken(event: APIGatewayProxyEvent): AuthContext | null;
/**
 * Middleware to require authentication
 *
 * Returns 401 error if token is missing or invalid
 *
 * @param event - API Gateway event
 * @returns AuthContext if authenticated, error response otherwise
 */
export declare function requireAuth(event: APIGatewayProxyEvent): AuthContext | APIGatewayProxyResult;
/**
 * Middleware to require specific role(s)
 *
 * Returns 401 if not authenticated, 403 if insufficient permissions
 *
 * @param event - API Gateway event
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns AuthContext if authorized, error response otherwise
 */
export declare function requireRole(event: APIGatewayProxyEvent, allowedRoles: UserRole[]): AuthContext | APIGatewayProxyResult;
/**
 * Check if auth result is an error response
 *
 * Type guard to distinguish between AuthContext and error response
 */
export declare function isErrorResponse(result: AuthContext | APIGatewayProxyResult): result is APIGatewayProxyResult;
//# sourceMappingURL=auth.d.ts.map