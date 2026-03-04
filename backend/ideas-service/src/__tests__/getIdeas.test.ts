/**
 * Tests for idea retrieval endpoints
 * 
 * Tests GET /ideas (list with role-based filtering) and GET /ideas/{ideaId} (single idea)
 */

import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  createIdea, 
  getIdeaById, 
  getAllIdeas, 
  getIdeasBySubmitter, 
  getIdeasByAssignee, 
  getIdeasByStatus 
} from '../db';
import { Idea } from '../types';

// Mock the database module
jest.mock('../db');

const mockedCreateIdea = createIdea as jest.MockedFunction<typeof createIdea>;
const mockedGetIdeaById = getIdeaById as jest.MockedFunction<typeof getIdeaById>;
const mockedGetAllIdeas = getAllIdeas as jest.MockedFunction<typeof getAllIdeas>;
const mockedGetIdeasBySubmitter = getIdeasBySubmitter as jest.MockedFunction<typeof getIdeasBySubmitter>;
const mockedGetIdeasByAssignee = getIdeasByAssignee as jest.MockedFunction<typeof getIdeasByAssignee>;
const mockedGetIdeasByStatus = getIdeasByStatus as jest.MockedFunction<typeof getIdeasByStatus>;

describe('GET /ideas - List ideas with role-based filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockIdea = (overrides: Partial<Idea> = {}): Idea => ({
    ideaId: 'test-idea-id',
    title: 'Test Idea',
    description: 'Test Description',
    submitterId: 'user-1',
    status: 'Pending Review',
    comments: [],
    statusHistory: [
      {
        status: 'Pending Review',
        changedBy: 'user-1',
        changedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  });

  test('Employee role returns ideas submitted by that employee', async () => {
    const employeeIdeas = [
      createMockIdea({ ideaId: 'idea-1', submitterId: 'employee-1' }),
      createMockIdea({ ideaId: 'idea-2', submitterId: 'employee-1' })
    ];
    
    mockedGetIdeasBySubmitter.mockResolvedValue(employeeIdeas);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'employee-1',
        role: 'Employee'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedGetIdeasBySubmitter).toHaveBeenCalledWith('employee-1');
    expect(body.ideas).toHaveLength(2);
    expect(body.ideas[0].submitterId).toBe('employee-1');
  });

  test('Reviewer role returns ideas with status Pending Review or In Review', async () => {
    const pendingIdeas = [
      createMockIdea({ ideaId: 'idea-1', status: 'Pending Review' })
    ];
    const inReviewIdeas = [
      createMockIdea({ ideaId: 'idea-2', status: 'In Review' })
    ];
    
    mockedGetIdeasByStatus.mockImplementation((status) => {
      if (status === 'Pending Review') return Promise.resolve(pendingIdeas);
      if (status === 'In Review') return Promise.resolve(inReviewIdeas);
      return Promise.resolve([]);
    });

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'reviewer-1',
        role: 'Reviewer'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedGetIdeasByStatus).toHaveBeenCalledWith('Pending Review');
    expect(mockedGetIdeasByStatus).toHaveBeenCalledWith('In Review');
    expect(body.ideas).toHaveLength(2);
  });

  test('Implementer role returns ideas assigned to that implementer', async () => {
    const assignedIdeas = [
      createMockIdea({ 
        ideaId: 'idea-1', 
        assigneeId: 'implementer-1',
        status: 'Assigned'
      }),
      createMockIdea({ 
        ideaId: 'idea-2', 
        assigneeId: 'implementer-1',
        status: 'In Progress'
      })
    ];
    
    mockedGetIdeasByAssignee.mockResolvedValue(assignedIdeas);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'implementer-1',
        role: 'Implementer'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedGetIdeasByAssignee).toHaveBeenCalledWith('implementer-1');
    expect(body.ideas).toHaveLength(2);
    expect(body.ideas[0].assigneeId).toBe('implementer-1');
  });

  test('Admin role returns all ideas', async () => {
    const allIdeas = [
      createMockIdea({ ideaId: 'idea-1', submitterId: 'user-1' }),
      createMockIdea({ ideaId: 'idea-2', submitterId: 'user-2' }),
      createMockIdea({ ideaId: 'idea-3', submitterId: 'user-3', status: 'Completed' })
    ];
    
    mockedGetAllIdeas.mockResolvedValue(allIdeas);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'admin-1',
        role: 'Admin'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedGetAllIdeas).toHaveBeenCalled();
    expect(body.ideas).toHaveLength(3);
  });

  test('Returns validation error when userId is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        role: 'Employee'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('userId and role');
  });

  test('Returns validation error when role is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'user-1'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('userId and role');
  });

  test('Returns validation error for invalid role', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'user-1',
        role: 'InvalidRole'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Invalid role');
  });

  test('Returns empty array when no ideas match filter', async () => {
    mockedGetIdeasBySubmitter.mockResolvedValue([]);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'employee-1',
        role: 'Employee'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.ideas).toEqual([]);
  });

  test('Handles database errors gracefully', async () => {
    mockedGetIdeasBySubmitter.mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas',
      queryStringParameters: {
        userId: 'employee-1',
        role: 'Employee'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /ideas/{ideaId} - Get single idea by ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockIdea = (overrides: Partial<Idea> = {}): Idea => ({
    ideaId: 'test-idea-id',
    title: 'Test Idea',
    description: 'Test Description',
    submitterId: 'user-1',
    status: 'Pending Review',
    comments: [],
    statusHistory: [
      {
        status: 'Pending Review',
        changedBy: 'user-1',
        changedAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  });

  test('Returns idea when it exists', async () => {
    const mockIdea = createMockIdea({ ideaId: 'idea-123' });
    mockedGetIdeaById.mockResolvedValue(mockIdea);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas/idea-123',
      pathParameters: {
        ideaId: 'idea-123'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(mockedGetIdeaById).toHaveBeenCalledWith('idea-123');
    expect(body.idea.ideaId).toBe('idea-123');
    expect(body.idea.title).toBe('Test Idea');
  });

  test('Returns idea with all required fields', async () => {
    const mockIdea = createMockIdea({
      ideaId: 'idea-123',
      title: 'Complete Idea',
      description: 'Full description',
      submitterId: 'user-1',
      assigneeId: 'user-2',
      status: 'In Progress',
      comments: [
        {
          commentId: 'comment-1',
          authorId: 'user-2',
          text: 'Working on it',
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ]
    });
    mockedGetIdeaById.mockResolvedValue(mockIdea);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas/idea-123',
      pathParameters: {
        ideaId: 'idea-123'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.idea).toHaveProperty('ideaId');
    expect(body.idea).toHaveProperty('title');
    expect(body.idea).toHaveProperty('description');
    expect(body.idea).toHaveProperty('status');
    expect(body.idea).toHaveProperty('submitterId');
    expect(body.idea).toHaveProperty('assigneeId');
    expect(body.idea).toHaveProperty('createdAt');
    expect(body.idea).toHaveProperty('updatedAt');
    expect(body.idea.comments).toHaveLength(1);
  });

  test('Returns 404 when idea does not exist', async () => {
    mockedGetIdeaById.mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas/nonexistent-id',
      pathParameters: {
        ideaId: 'nonexistent-id'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('nonexistent-id');
  });

  test('Returns validation error when ideaId is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas/',
      pathParameters: {}
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('ideaId');
  });

  test('Handles database errors gracefully', async () => {
    mockedGetIdeaById.mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/ideas/idea-123',
      pathParameters: {
        ideaId: 'idea-123'
      }
    };

    const result = await handler(event as APIGatewayProxyEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
