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
/**
 * Lambda handler function
 */
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=index.d.ts.map