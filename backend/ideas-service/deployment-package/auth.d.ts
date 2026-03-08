/**
 * Authorization middleware for Ideas Service
 *
 * Provides JWT token validation and role-based access control.
 */
import { APIGatewayProxyEvent } from 'aws-lambda';
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
//# sourceMappingURL=auth.d.ts.map