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
import { randomUUID } from 'crypto';
import { 
  createIdea, 
  getIdeaById, 
  getAllIdeas, 
  getIdeasBySubmitter, 
  getIdeasByAssignee, 
  getIdeasByStatus,
  updateIdea,
  userExists,
  DatabaseError
} from './db';
import { validateCreateIdeaRequest, validateAssignIdeaRequest, validateUpdateStatusRequest, validateCreateCommentRequest, ValidationError } from './validation';
import { Idea, ErrorResponse, AssignIdeaRequest, UpdateStatusRequest, StatusChange, Comment, CreateCommentRequest } from './types';

/**
 * Common response headers
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Extract ideaId from API Gateway event
 * Handles both v1 and v2 event formats and different path parameter names
 */
function extractIdeaId(event: APIGatewayProxyEvent): string | undefined {
  // Try pathParameters first (v1 format or explicit parameter name)
  const ideaId = event.pathParameters?.ideaId || event.pathParameters?.proxy;
  if (ideaId && !ideaId.includes('/')) return ideaId;
  
  // Extract from path directly (for v2 format or when pathParameters is not set correctly)
  const path = event.path || (event as any).rawPath || '';
  // Match /ideas/{ideaId} but not /ideas/{ideaId}/comments or /ideas/{ideaId}/assign etc.
  const match = path.match(/\/ideas\/([a-f0-9-]+)(?:\/|$)/);
  return match ? match[1] : undefined;
}

/**
 * Create error response
 */
function errorResponse(statusCode: number, code: string, message: string, details?: any): APIGatewayProxyResult {
  const response: ErrorResponse = {
    error: {
      code,
      message,
      details
    }
  };
  
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(response)
  };
}

/**
 * Create success response
 */
function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

/**
 * Handle POST /ideas - Submit new idea
 */
async function handleCreateIdea(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    console.log('Creating new idea');
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    validateCreateIdeaRequest(body);
    
    // Validate referential integrity - submitter must exist
    const submitterExists = await userExists(body.submitterId);
    if (!submitterExists) {
      return errorResponse(404, 'NOT_FOUND', `Submitter with ID ${body.submitterId} not found`);
    }
    
    // Generate unique idea ID
    const ideaId = randomUUID();
    const now = new Date().toISOString();
    
    // Create idea object with initial status "Pending Review"
    const idea: Idea = {
      ideaId,
      title: body.title,
      description: body.description,
      submitterId: body.submitterId,
      status: 'Pending Review',
      comments: [],
      statusHistory: [
        {
          status: 'Pending Review',
          changedBy: body.submitterId,
          changedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    
    // Persist to DynamoDB - awaits confirmation before returning
    await createIdea(idea);
    
    console.log(`Successfully created idea: ${ideaId}`);
    
    // Return success with idea ID
    return successResponse(201, { ideaId });
    
  } catch (error) {
    console.error('Error creating idea:', error);
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    if (error instanceof DatabaseError) {
      // Map database errors to appropriate HTTP status codes
      if (error.code === 'CONDITIONAL_CHECK_FAILED') {
        return errorResponse(409, 'CONFLICT', 'Idea with this ID already exists');
      }
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Handle GET /ideas - List ideas with role-based filtering
 * 
 * Query parameters:
 * - userId: User ID making the request (required)
 * - role: User role (required) - Employee, Reviewer, Implementer, Admin
 * 
 * Filtering rules:
 * - Employee: Returns ideas submitted by that employee
 * - Reviewer: Returns ideas with status "Pending Review" or "In Review"
 * - Implementer: Returns ideas assigned to that implementer
 * - Admin: Returns all ideas
 */
async function handleListIdeas(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    console.log('Listing ideas with role-based filtering');
    
    const userId = event.queryStringParameters?.userId;
    const role = event.queryStringParameters?.role;
    
    // Validate required parameters
    if (!userId || !role) {
      return errorResponse(400, 'VALIDATION_ERROR', 'userId and role query parameters are required');
    }
    
    let ideas: Idea[] = [];
    
    // Apply role-based filtering
    switch (role) {
      case 'Employee':
        // Employees see their own submissions
        console.log(`Fetching ideas for employee: ${userId}`);
        ideas = await getIdeasBySubmitter(userId);
        break;
        
      case 'Reviewer':
        // Reviewers see ideas pending review or in review
        console.log('Fetching ideas for reviewer');
        const pendingIdeas = await getIdeasByStatus('Pending Review');
        const inReviewIdeas = await getIdeasByStatus('In Review');
        ideas = [...pendingIdeas, ...inReviewIdeas];
        break;
        
      case 'Implementer':
        // Implementers see their assigned ideas
        console.log(`Fetching ideas for implementer: ${userId}`);
        ideas = await getIdeasByAssignee(userId);
        break;
        
      case 'Admin':
        // Admins see all ideas
        console.log('Fetching all ideas for admin');
        ideas = await getAllIdeas();
        break;
        
      default:
        return errorResponse(400, 'VALIDATION_ERROR', `Invalid role: ${role}`);
    }
    
    console.log(`Successfully retrieved ${ideas.length} ideas for role: ${role}`);
    
    // Return ideas list
    return successResponse(200, { ideas });
    
  } catch (error) {
    console.error('Error listing ideas:', error);
    
    if (error instanceof DatabaseError) {
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Handle GET /ideas/{ideaId} - Get single idea by ID
 */
async function handleGetIdea(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ideaId = extractIdeaId(event);
    
    if (!ideaId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ideaId path parameter is required');
    }
    
    console.log(`Retrieving idea: ${ideaId}`);
    
    // Retrieve idea from database
    const idea = await getIdeaById(ideaId);
    
    if (!idea) {
      return errorResponse(404, 'NOT_FOUND', `Idea with ID ${ideaId} not found`);
    }
    
    console.log(`Successfully retrieved idea: ${ideaId}`);
    
    // Return idea
    return successResponse(200, { idea });
    
  } catch (error) {
    console.error('Error getting idea:', error);
    
    if (error instanceof DatabaseError) {
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Handle PUT /ideas/{ideaId}/assign - Assign idea to implementer
 * 
 * Request body:
 * - assigneeId: User ID of the implementer to assign
 * - reviewerId: User ID of the reviewer making the assignment
 * 
 * Authorization: Reviewer and Admin roles only
 */
async function handleAssignIdea(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ideaId = extractIdeaId(event);
    
    if (!ideaId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ideaId path parameter is required');
    }
    
    console.log(`Assigning idea: ${ideaId}`);
    
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    validateAssignIdeaRequest(body);
    
    const { assigneeId, reviewerId } = body as AssignIdeaRequest;
    
    // Check authorization - extract role from headers or token
    // For now, we'll assume the role is passed in headers
    const role = event.headers?.['x-user-role'] || event.headers?.['X-User-Role'];
    
    if (!role || (role !== 'Reviewer' && role !== 'Admin')) {
      return errorResponse(403, 'FORBIDDEN', 'Only Reviewers and Admins can assign ideas');
    }
    
    // Check if idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      return errorResponse(404, 'NOT_FOUND', `Idea with ID ${ideaId} not found`);
    }
    
    // Validate assignee exists in Users table
    const assigneeExists = await userExists(assigneeId);
    if (!assigneeExists) {
      return errorResponse(404, 'NOT_FOUND', `User with ID ${assigneeId} not found`);
    }
    
    // Update idea with assignee and set status to "Assigned"
    const now = new Date().toISOString();
    const statusChange: StatusChange = {
      status: 'Assigned',
      changedBy: reviewerId,
      changedAt: now
    };
    
    // Persist update to DynamoDB - awaits confirmation before returning
    await updateIdea(ideaId, {
      assigneeId,
      status: 'Assigned',
      statusHistory: [...idea.statusHistory, statusChange],
      updatedAt: now
    });
    
    console.log(`Successfully assigned idea ${ideaId} to user ${assigneeId}`);
    
    // Return success
    return successResponse(200, { success: true });
    
  } catch (error) {
    console.error('Error assigning idea:', error);
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    if (error instanceof DatabaseError) {
      if (error.code === 'CONDITIONAL_CHECK_FAILED') {
        return errorResponse(404, 'NOT_FOUND', `Idea with ID ${event.pathParameters?.ideaId} not found`);
      }
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}
/**
 * Handle PUT /ideas/{ideaId}/status - Update idea status
 * 
 * Request body:
 * - status: New status value
 * - userId: User ID making the update
 * - role: User role (Implementer, Reviewer, Admin)
 * - reason: Rejection reason (required when status is "Rejected")
 * 
 * Authorization:
 * - Implementer: Can update status of ideas assigned to them
 * - Reviewer: Can update status to "Approved" or "Rejected"
 * - Admin: Can update status of any idea
 */
async function handleUpdateStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ideaId = extractIdeaId(event);
    
    if (!ideaId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ideaId path parameter is required');
    }
    
    console.log(`Updating status for idea: ${ideaId}`);
    
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    validateUpdateStatusRequest(body);
    
    const { status, userId, role, reason } = body as UpdateStatusRequest;
    
    // Check if idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      return errorResponse(404, 'NOT_FOUND', `Idea with ID ${ideaId} not found`);
    }
    
    // Check authorization based on role
    if (role === 'Implementer') {
      // Implementers can only update ideas assigned to them
      if (idea.assigneeId !== userId) {
        return errorResponse(403, 'FORBIDDEN', 'Implementers can only update ideas assigned to them');
      }
    } else if (role === 'Reviewer') {
      // Reviewers can update status (typically to Approved or Rejected)
      // No additional checks needed
    } else if (role === 'Admin') {
      // Admins can update any idea
      // No additional checks needed
    } else {
      // Other roles (Employee) cannot update status
      return errorResponse(403, 'FORBIDDEN', 'Insufficient permissions to update idea status');
    }
    
    // Update idea status and add to status history
    const now = new Date().toISOString();
    const statusChange: StatusChange = {
      status,
      changedBy: userId,
      changedAt: now
    };
    
    const updates: Partial<Omit<Idea, 'ideaId' | 'createdAt'>> = {
      status,
      statusHistory: [...idea.statusHistory, statusChange],
      updatedAt: now
    };
    
    // Add rejection reason if status is Rejected
    if (status === 'Rejected' && reason) {
      updates.rejectionReason = reason;
    }
    
    // Persist update to DynamoDB - awaits confirmation before returning
    await updateIdea(ideaId, updates);
    
    console.log(`Successfully updated status for idea ${ideaId} to ${status}`);
    
    // Return success
    return successResponse(200, { success: true });
    
  } catch (error) {
    console.error('Error updating status:', error);
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    if (error instanceof DatabaseError) {
      if (error.code === 'CONDITIONAL_CHECK_FAILED') {
        return errorResponse(404, 'NOT_FOUND', `Idea with ID ${event.pathParameters?.ideaId} not found`);
      }
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Handle POST /ideas/{ideaId}/comments - Add comment to idea
 * 
 * Request body:
 * - userId: User ID of the comment author
 * - text: Comment text
 * 
 * Authorization:
 * - Implementer: Can comment on ideas assigned to them
 * - Reviewer: Can comment on any idea
 * - Admin: Can comment on any idea
 */
async function handleCreateComment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ideaId = extractIdeaId(event);
    
    if (!ideaId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ideaId path parameter is required');
    }
    
    console.log(`Adding comment to idea: ${ideaId}`);
    
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    validateCreateCommentRequest(body);
    
    const { userId, text } = body as CreateCommentRequest;
    
    // Check authorization - extract role from headers
    const role = event.headers?.['x-user-role'] || event.headers?.['X-User-Role'];
    
    if (!role) {
      return errorResponse(403, 'FORBIDDEN', 'User role is required');
    }
    
    // Validate referential integrity - user must exist
    const authorExists = await userExists(userId);
    if (!authorExists) {
      return errorResponse(404, 'NOT_FOUND', `User with ID ${userId} not found`);
    }
    
    // Check if idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      return errorResponse(404, 'NOT_FOUND', `Idea with ID ${ideaId} not found`);
    }
    
    // Check authorization based on role
    if (role === 'Implementer') {
      // Implementers can only comment on ideas assigned to them
      if (idea.assigneeId !== userId) {
        return errorResponse(403, 'FORBIDDEN', 'Implementers can only comment on ideas assigned to them');
      }
    } else if (role === 'Reviewer' || role === 'Admin') {
      // Reviewers and Admins can comment on any idea
      // No additional checks needed
    } else {
      // Other roles (Employee) cannot add comments
      return errorResponse(403, 'FORBIDDEN', 'Insufficient permissions to add comments');
    }
    
    // Generate unique comment ID
    const commentId = randomUUID();
    const now = new Date().toISOString();
    
    // Create comment object
    const comment: Comment = {
      commentId,
      authorId: userId,
      text,
      createdAt: now
    };
    
    // Append comment to idea's comments array - awaits confirmation before returning
    await updateIdea(ideaId, {
      comments: [...idea.comments, comment],
      updatedAt: now
    });
    
    console.log(`Successfully added comment ${commentId} to idea ${ideaId}`);
    
    // Return success with comment ID
    return successResponse(201, { commentId });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    
    if (error instanceof ValidationError) {
      return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
    }
    
    if (error instanceof SyntaxError) {
      return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
    }
    
    if (error instanceof DatabaseError) {
      if (error.code === 'CONDITIONAL_CHECK_FAILED') {
        return errorResponse(404, 'NOT_FOUND', `Idea with ID ${event.pathParameters?.ideaId} not found`);
      }
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Handle GET /ideas/{ideaId}/comments - Retrieve comments for an idea
 * 
 * Returns all comments for the specified idea in chronological order (earliest to latest).
 */
async function handleGetComments(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ideaId = extractIdeaId(event);
    
    if (!ideaId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ideaId path parameter is required');
    }
    
    console.log(`Retrieving comments for idea: ${ideaId}`);
    
    // Check if idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      return errorResponse(404, 'NOT_FOUND', `Idea with ID ${ideaId} not found`);
    }
    
    // Comments are already stored in chronological order (earliest to latest)
    // as they are appended to the array when created
    const comments = idea.comments;
    
    console.log(`Successfully retrieved ${comments.length} comments for idea ${ideaId}`);
    
    // Return comments
    return successResponse(200, { comments });
    
  } catch (error) {
    console.error('Error retrieving comments:', error);
    
    if (error instanceof DatabaseError) {
      if (error.code === 'TABLE_NOT_FOUND') {
        return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
      }
      if (error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', error.message);
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
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
  // Remove stage prefix if it exists (e.g., /prod/ideas -> /ideas)
  const pathSegments = path.split('/').filter((s: string) => s);
  if (pathSegments.length > 0 && pathSegments[0] === 'prod') {
    path = '/' + pathSegments.slice(1).join('/');
  }
  
  console.log('Request:', { method, httpMethod, originalPath: event.path, processedPath: path });
  
  try {
    // Handle OPTIONS for CORS preflight
    if (method === 'OPTIONS') {
      return successResponse(200, {});
    }
    
    // Route to appropriate handler - check both original and clean paths
    if (method === 'POST' && path === '/ideas') {
      return await handleCreateIdea(event);
    }
    
    if (method === 'GET' && path === '/ideas') {
      return await handleListIdeas(event);
    }
    
    if (method === 'GET' && path.startsWith('/ideas/') && !path.includes('/comments')) {
      return await handleGetIdea(event);
    }
    
    if (method === 'PUT' && path.match(/^\/ideas\/[^/]+\/assign$/)) {
      return await handleAssignIdea(event);
    }
    
    if (method === 'PUT' && path.match(/^\/ideas\/[^/]+\/status$/)) {
      return await handleUpdateStatus(event);
    }
    
    if (method === 'POST' && path.match(/^\/ideas\/[^/]+\/comments$/)) {
      return await handleCreateComment(event);
    }
    
    if (method === 'GET' && path.match(/^\/ideas\/[^/]+\/comments$/)) {
      return await handleGetComments(event);
    }
    
    // Unknown endpoint
    console.warn(`Unknown endpoint: ${method} ${path}`);
    return errorResponse(404, 'NOT_FOUND', `Endpoint ${method} ${path} not found`);
    
  } catch (error) {
    console.error('Unhandled error in Lambda handler:', error);
    
    // Handle any unexpected errors that weren't caught by individual handlers
    if (error instanceof DatabaseError) {
      if (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'THROUGHPUT_EXCEEDED' || error.code === 'REQUEST_LIMIT_EXCEEDED') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', error.message);
      }
      return errorResponse(500, 'DATABASE_ERROR', 'A database error occurred');
    }
    
    return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
};
