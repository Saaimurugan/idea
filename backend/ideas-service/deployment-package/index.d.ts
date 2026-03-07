/**
 * Ideas Service Lambda Function
 *
 * Handles all idea CRUD operations, assignments, and comments for the Employee Ideas Management System.
 *
 * Endpoints:
 * - POST /ideas - Submit idea
 * - GET /ideas - List ideas (role-based filtering)
 * - GET /ideas/{ideaId} - Get idea by ID
 * - PUT /ideas/{ideaId}/assign - Assign idea (Reviewer/Admin)
 * - PUT /ideas/{ideaId}/status - Update status
 * - POST /ideas/{ideaId}/comments - Add comment
 * - GET /ideas/{ideaId}/comments - Get comments
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler function
 */
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=index.d.ts.map