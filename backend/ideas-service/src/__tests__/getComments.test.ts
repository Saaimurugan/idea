/**
 * Tests for comment retrieval endpoint (GET /ideas/{ideaId}/comments)
 */

import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getIdeaById } from '../db';
import { Idea, Comment } from '../types';
import { randomUUID } from 'crypto';

// Mock the db module
jest.mock('../db');

const mockGetIdeaById = getIdeaById as jest.MockedFunction<typeof getIdeaById>;

describe('GET /ideas/{ideaId}/comments - Retrieve Comments', () => {
  const ideaId = randomUUID();
  const userId1 = randomUUID();
  const userId2 = randomUUID();
  const userId3 = randomUUID();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (
    pathParams: Record<string, string> = { ideaId }
  ): Partial<APIGatewayProxyEvent> => ({
    httpMethod: 'GET',
    path: `/ideas/${ideaId}/comments`,
    pathParameters: pathParams,
    headers: {},
    body: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: '',
    stageVariables: null
  });

  describe('Successful comment retrieval', () => {
    it('should return empty array when idea has no comments', async () => {
      const mockIdea: Idea = {
        ideaId,
        title: 'Test Idea',
        description: 'Test Description',
        submitterId: userId1,
        status: 'Pending Review',
        comments: [],
        statusHistory: [
          {
            status: 'Pending Review',
            changedBy: userId1,
            changedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.comments).toEqual([]);
    });

    it('should return single comment', async () => {
      const comment: Comment = {
        commentId: randomUUID(),
        authorId: userId1,
        text: 'First comment',
        createdAt: '2024-01-01T10:00:00.000Z'
      };

      const mockIdea: Idea = {
        ideaId,
        title: 'Test Idea',
        description: 'Test Description',
        submitterId: userId1,
        status: 'In Progress',
        comments: [comment],
        statusHistory: [
          {
            status: 'Pending Review',
            changedBy: userId1,
            changedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.comments).toHaveLength(1);
      expect(body.comments[0]).toEqual(comment);
    });

    it('should return multiple comments in chronological order', async () => {
      const comment1: Comment = {
        commentId: randomUUID(),
        authorId: userId1,
        text: 'First comment',
        createdAt: '2024-01-01T10:00:00.000Z'
      };

      const comment2: Comment = {
        commentId: randomUUID(),
        authorId: userId2,
        text: 'Second comment',
        createdAt: '2024-01-01T11:00:00.000Z'
      };

      const comment3: Comment = {
        commentId: randomUUID(),
        authorId: userId3,
        text: 'Third comment',
        createdAt: '2024-01-01T12:00:00.000Z'
      };

      const mockIdea: Idea = {
        ideaId,
        title: 'Test Idea',
        description: 'Test Description',
        submitterId: userId1,
        status: 'In Progress',
        comments: [comment1, comment2, comment3],
        statusHistory: [
          {
            status: 'Pending Review',
            changedBy: userId1,
            changedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.comments).toHaveLength(3);
      expect(body.comments[0]).toEqual(comment1);
      expect(body.comments[1]).toEqual(comment2);
      expect(body.comments[2]).toEqual(comment3);
      
      // Verify chronological order (earliest to latest)
      expect(body.comments[0].createdAt).toBe('2024-01-01T10:00:00.000Z');
      expect(body.comments[1].createdAt).toBe('2024-01-01T11:00:00.000Z');
      expect(body.comments[2].createdAt).toBe('2024-01-01T12:00:00.000Z');
    });
  });

  describe('Validation', () => {
    it('should reject request without ideaId path parameter', async () => {
      const event = createEvent({});

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

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('not found');
    });

    it('should return 500 for database errors', async () => {
      mockGetIdeaById.mockRejectedValue(new Error('Database error'));

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Comment data completeness', () => {
    it('should return all comment fields', async () => {
      const comment: Comment = {
        commentId: randomUUID(),
        authorId: userId1,
        text: 'Test comment with all fields',
        createdAt: '2024-01-01T10:00:00.000Z'
      };

      const mockIdea: Idea = {
        ideaId,
        title: 'Test Idea',
        description: 'Test Description',
        submitterId: userId1,
        status: 'In Progress',
        comments: [comment],
        statusHistory: [
          {
            status: 'Pending Review',
            changedBy: userId1,
            changedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetIdeaById.mockResolvedValue(mockIdea);

      const event = createEvent();
      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.comments[0]).toHaveProperty('commentId');
      expect(body.comments[0]).toHaveProperty('authorId');
      expect(body.comments[0]).toHaveProperty('text');
      expect(body.comments[0]).toHaveProperty('createdAt');
    });
  });
});
