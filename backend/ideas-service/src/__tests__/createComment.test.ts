/**
 * Tests for comment creation endpoint (POST /ideas/{ideaId}/comments)
 */

import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createIdea, getIdeaById, updateIdea, userExists } from '../db';
import { Idea } from '../types';
import { randomUUID } from 'crypto';

// Mock the db module
jest.mock('../db');

const mockCreateIdea = createIdea as jest.MockedFunction<typeof createIdea>;
const mockGetIdeaById = getIdeaById as jest.MockedFunction<typeof getIdeaById>;
const mockUpdateIdea = updateIdea as jest.MockedFunction<typeof updateIdea>;
const mockUserExists = userExists as jest.MockedFunction<typeof userExists>;

describe('POST /ideas/{ideaId}/comments - Create Comment', () => {
  const ideaId = randomUUID();
  const userId = randomUUID();
  const assigneeId = randomUUID();
  
  const mockIdea: Idea = {
    ideaId,
    title: 'Test Idea',
    description: 'Test Description',
    submitterId: randomUUID(),
    assigneeId,
    status: 'In Progress',
    comments: [],
    statusHistory: [
      {
        status: 'Pending Review',
        changedBy: randomUUID(),
        changedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (
    body: any,
    role: string,
    pathParams: Record<string, string> = { ideaId }
  ): Partial<APIGatewayProxyEvent> => ({
    httpMethod: 'POST',
    path: `/ideas/${ideaId}/comments`,
    pathParameters: pathParams,
    headers: {
      'x-user-role': role
    },
    body: JSON.stringify(body),
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: '',
    stageVariables: null
  });

  describe('Successful comment creation', () => {
    it('should allow Implementer to comment on assigned idea', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId: assigneeId, text: 'This is a comment' },
        'Implementer'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.commentId).toBeDefined();
      expect(typeof body.commentId).toBe('string');
    });

    it('should allow Reviewer to comment on any idea', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId, text: 'Reviewer comment' },
        'Reviewer'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.commentId).toBeDefined();
    });

    it('should allow Admin to comment on any idea', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId, text: 'Admin comment' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.commentId).toBeDefined();
    });
  });

  describe('Authorization checks', () => {
    it('should reject Implementer commenting on unassigned idea', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId, text: 'This should fail' },
        'Implementer'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('assigned to them');
    });

    it('should reject Employee from adding comments', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId, text: 'Employee comment' },
        'Employee'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Insufficient permissions');
    });

    it('should reject request without role header', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event = createEvent(
        { userId, text: 'Comment' },
        ''
      );
      delete event.headers;

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('role is required');
    });
  });

  describe('Validation', () => {
    it('should reject comment without userId', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent(
        { text: 'Comment without userId' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('User ID');
    });

    it('should reject comment without text', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent(
        { userId },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('text');
    });

    it('should reject comment with empty text', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent(
        { userId, text: '' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment with text exceeding 2000 characters', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent(
        { userId, text: 'a'.repeat(2001) },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('2000 characters');
    });

    it('should reject request without ideaId path parameter', async () => {
      const event = createEvent(
        { userId, text: 'Comment' },
        'Admin',
        {}
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('ideaId');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when idea does not exist', async () => {
      mockGetIdeaById.mockResolvedValue(null);

      const event = createEvent(
        { userId, text: 'Comment on non-existent idea' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('not found');
    });

    it('should return 404 when user does not exist', async () => {
      mockUserExists.mockResolvedValue(false);

      const event = createEvent(
        { userId: 'nonexistent-user', text: 'Comment' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('User with ID nonexistent-user not found');
    });

    it('should return 400 for invalid JSON', async () => {
      const event = createEvent(
        { userId, text: 'Comment' },
        'Admin'
      );
      event.body = 'invalid json';

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INVALID_JSON');
    });

    it('should return 500 for database errors', async () => {
      mockUserExists.mockResolvedValue(true);
      mockGetIdeaById.mockRejectedValue(new Error('Database error'));

      const event = createEvent(
        { userId, text: 'Comment' },
        'Admin'
      );

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Comment data integrity', () => {
    it('should generate unique comment ID', async () => {
      mockGetIdeaById.mockResolvedValue(mockIdea);
      mockUserExists.mockResolvedValue(true);

      const event1 = createEvent(
        { userId, text: 'First comment' },
        'Admin'
      );
      const event2 = createEvent(
        { userId, text: 'Second comment' },
        'Admin'
      );

      const result1 = await handler(event1 as APIGatewayProxyEvent);
      const result2 = await handler(event2 as APIGatewayProxyEvent);

      const body1 = JSON.parse(result1.body);
      const body2 = JSON.parse(result2.body);

      expect(body1.commentId).not.toBe(body2.commentId);
    });
  });
});
