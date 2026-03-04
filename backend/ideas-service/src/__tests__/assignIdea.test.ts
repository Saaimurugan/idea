/**
 * Tests for PUT /ideas/{ideaId}/assign endpoint
 * 
 * Tests idea assignment functionality including:
 * - Successful assignment by Reviewer
 * - Successful assignment by Admin
 * - Authorization checks
 * - Assignee existence validation
 * - Idea existence validation
 */

import { handler } from '../index';
import * as db from '../db';
import { Idea } from '../types';

// Mock the database module
jest.mock('../db');
const mockGetIdeaById = db.getIdeaById as jest.MockedFunction<typeof db.getIdeaById>;
const mockUpdateIdea = db.updateIdea as jest.MockedFunction<typeof db.updateIdea>;
const mockUserExists = db.userExists as jest.MockedFunction<typeof db.userExists>;

describe('PUT /ideas/{ideaId}/assign - Assign idea', () => {
  const mockIdea: Idea = {
    ideaId: 'idea-123',
    title: 'Test Idea',
    description: 'Test description',
    submitterId: 'employee-123',
    status: 'Pending Review',
    comments: [],
    statusHistory: [
      {
        status: 'Pending Review',
        changedBy: 'employee-123',
        changedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Reviewer can assign idea to implementer', async () => {
    mockGetIdeaById.mockResolvedValue(mockIdea);
    mockUserExists.mockResolvedValue(true);
    mockUpdateIdea.mockResolvedValue();

    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'reviewer-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGetIdeaById).toHaveBeenCalledWith('idea-123');
    expect(mockUserExists).toHaveBeenCalledWith('implementer-123');
    expect(mockUpdateIdea).toHaveBeenCalled();
    
    // Verify the update includes assigneeId and status "Assigned"
    const updateCall = mockUpdateIdea.mock.calls[0];
    expect(updateCall[0]).toBe('idea-123');
    expect(updateCall[1]).toMatchObject({
      assigneeId: 'implementer-123',
      status: 'Assigned'
    });
    expect(updateCall[1].statusHistory).toHaveLength(2);
    expect(updateCall[1].statusHistory![1]).toMatchObject({
      status: 'Assigned',
      changedBy: 'reviewer-123'
    });
  });

  test('Admin can assign idea to implementer', async () => {
    mockGetIdeaById.mockResolvedValue(mockIdea);
    mockUserExists.mockResolvedValue(true);
    mockUpdateIdea.mockResolvedValue();

    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Admin' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'admin-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.success).toBe(true);
  });

  test('Employee cannot assign ideas', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Employee' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'employee-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(mockGetIdeaById).not.toHaveBeenCalled();
  });

  test('Implementer cannot assign ideas', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Implementer' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'implementer-456'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('Returns 404 when idea not found', async () => {
    mockGetIdeaById.mockResolvedValue(null);

    const event = {
      httpMethod: 'PUT',
      path: '/ideas/nonexistent/assign',
      pathParameters: { ideaId: 'nonexistent' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'reviewer-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Idea');
  });

  test('Returns 404 when assignee not found', async () => {
    mockGetIdeaById.mockResolvedValue(mockIdea);
    mockUserExists.mockResolvedValue(false);

    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        assigneeId: 'nonexistent-user',
        reviewerId: 'reviewer-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('User');
    expect(mockUpdateIdea).not.toHaveBeenCalled();
  });

  test('Returns 400 when assigneeId is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        reviewerId: 'reviewer-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Assignee ID');
  });

  test('Returns 400 when reviewerId is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        assigneeId: 'implementer-123'
      })
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Reviewer ID');
  });

  test('Returns 400 when request body is invalid JSON', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: 'invalid json'
    } as any;

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  test('Status history includes timestamp', async () => {
    mockGetIdeaById.mockResolvedValue(mockIdea);
    mockUserExists.mockResolvedValue(true);
    mockUpdateIdea.mockResolvedValue();

    const event = {
      httpMethod: 'PUT',
      path: '/ideas/idea-123/assign',
      pathParameters: { ideaId: 'idea-123' },
      headers: { 'x-user-role': 'Reviewer' },
      body: JSON.stringify({
        assigneeId: 'implementer-123',
        reviewerId: 'reviewer-123'
      })
    } as any;

    await handler(event);

    const updateCall = mockUpdateIdea.mock.calls[0];
    const statusChange = updateCall[1].statusHistory![1];
    
    expect(statusChange.changedAt).toBeDefined();
    expect(new Date(statusChange.changedAt).getTime()).toBeGreaterThan(0);
  });
});
