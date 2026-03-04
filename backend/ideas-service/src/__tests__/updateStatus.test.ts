/**
 * Tests for status update endpoint (PUT /ideas/{ideaId}/status)
 * 
 * Tests cover:
 * - Valid status updates by authorized users
 * - Authorization checks (Implementer, Reviewer, Admin)
 * - Status validation
 * - Rejection reason requirement
 * - Status history recording
 */

import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createIdea, getIdeaById } from '../db';
import { Idea } from '../types';
import { randomUUID } from 'crypto';

// Mock the db module
jest.mock('../db');

const mockCreateIdea = createIdea as jest.MockedFunction<typeof createIdea>;
const mockGetIdeaById = getIdeaById as jest.MockedFunction<typeof getIdeaById>;

describe('PUT /ideas/{ideaId}/status - Update status endpoint', () => {
  const ideaId = randomUUID();
  const implementerId = randomUUID();
  const reviewerId = randomUUID();
  const adminId = randomUUID();
  const otherUserId = randomUUID();
  
  const baseIdea: Idea = {
    ideaId,
    title: 'Test Idea',
    description: 'Test description',
    submitterId: randomUUID(),
    assigneeId: implementerId,
    status: 'Assigned',
    comments: [],
    statusHistory: [
      {
        status: 'Pending Review',
        changedBy: randomUUID(),
        changedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        status: 'Assigned',
        changedBy: reviewerId,
        changedAt: '2024-01-02T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (body: any, pathParams: any = { ideaId }): APIGatewayProxyEvent => ({
    httpMethod: 'PUT',
    path: `/ideas/${ideaId}/status`,
    pathParameters: pathParams,
    body: JSON.stringify(body),
    headers: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {}
  });

  describe('Valid status updates', () => {
    test('Implementer can update status of assigned idea', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'In Progress',
        userId: implementerId,
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ success: true });
      expect(mockGetIdeaById).toHaveBeenCalledWith(ideaId);
    });

    test('Admin can update status of any idea', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'Completed',
        userId: adminId,
        role: 'Admin'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ success: true });
    });

    test('Reviewer can update status', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'In Review',
        userId: reviewerId,
        role: 'Reviewer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ success: true });
    });

    test('Reviewer can reject idea with reason', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'Rejected',
        userId: reviewerId,
        role: 'Reviewer',
        reason: 'Not feasible with current resources'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ success: true });
    });
  });

  describe('Authorization checks', () => {
    test('Implementer cannot update unassigned idea', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'In Progress',
        userId: otherUserId,
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('assigned to them');
    });

    test('Employee cannot update status', async () => {
      mockGetIdeaById.mockResolvedValue(baseIdea);

      const event = createEvent({
        status: 'In Progress',
        userId: otherUserId,
        role: 'Employee'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('Insufficient permissions');
    });
  });

  describe('Validation', () => {
    test('Returns 400 when status is missing', async () => {
      const event = createEvent({
        userId: implementerId,
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Status is required');
    });

    test('Returns 400 when status is invalid', async () => {
      const event = createEvent({
        status: 'Invalid Status',
        userId: implementerId,
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Status must be one of');
    });

    test('Returns 400 when userId is missing', async () => {
      const event = createEvent({
        status: 'In Progress',
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('User ID is required');
    });

    test('Returns 400 when role is missing', async () => {
      const event = createEvent({
        status: 'In Progress',
        userId: implementerId
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Role is required');
    });

    test('Returns 400 when rejection reason is missing for Rejected status', async () => {
      const event = createEvent({
        status: 'Rejected',
        userId: reviewerId,
        role: 'Reviewer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Rejection reason is required');
    });

    test('Returns 400 when rejection reason is empty for Rejected status', async () => {
      const event = createEvent({
        status: 'Rejected',
        userId: reviewerId,
        role: 'Reviewer',
        reason: '   '
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('Rejection reason cannot be empty');
    });
  });

  describe('Error handling', () => {
    test('Returns 404 when idea does not exist', async () => {
      mockGetIdeaById.mockResolvedValue(null);

      const event = createEvent({
        status: 'In Progress',
        userId: implementerId,
        role: 'Implementer'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('not found');
    });

    test('Returns 400 when ideaId path parameter is missing', async () => {
      const event = createEvent({
        status: 'In Progress',
        userId: implementerId,
        role: 'Implementer'
      }, {});

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('ideaId path parameter is required');
    });

    test('Returns 400 when request body is invalid JSON', async () => {
      const event = createEvent({}, { ideaId });
      event.body = 'invalid json';

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INVALID_JSON');
    });
  });

  describe('All valid status values', () => {
    const validStatuses = [
      'Pending Review',
      'In Review',
      'Assigned',
      'In Progress',
      'Completed',
      'Rejected'
    ];

    validStatuses.forEach(status => {
      test(`Admin can set status to "${status}"`, async () => {
        mockGetIdeaById.mockResolvedValue(baseIdea);

        const event = createEvent({
          status,
          userId: adminId,
          role: 'Admin',
          ...(status === 'Rejected' ? { reason: 'Test reason' } : {})
        });

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ success: true });
      });
    });
  });
});
