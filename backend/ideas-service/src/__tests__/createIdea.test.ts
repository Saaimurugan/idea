/**
 * Unit tests for idea submission endpoint (POST /ideas)
 */

import { handler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as db from '../db';

// Mock the db module
jest.mock('../db');

describe('POST /ideas - Idea Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (body: any): APIGatewayProxyEvent => ({
    httpMethod: 'POST',
    path: '/ideas',
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  test('should create idea with valid title and description', async () => {
    const mockCreateIdea = jest.spyOn(db, 'createIdea').mockResolvedValue();
    const mockUserExists = jest.spyOn(db, 'userExists').mockResolvedValue(true);

    const event = createEvent({
      title: 'Improve office lighting',
      description: 'Install LED lights to reduce energy consumption',
      submitterId: 'user-123'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.ideaId).toBeDefined();
    expect(typeof body.ideaId).toBe('string');
    expect(mockUserExists).toHaveBeenCalledWith('user-123');
    expect(mockCreateIdea).toHaveBeenCalledTimes(1);

    // Verify the idea object passed to createIdea
    const createdIdea = mockCreateIdea.mock.calls[0][0];
    expect(createdIdea.title).toBe('Improve office lighting');
    expect(createdIdea.description).toBe('Install LED lights to reduce energy consumption');
    expect(createdIdea.submitterId).toBe('user-123');
    expect(createdIdea.status).toBe('Pending Review');
    expect(createdIdea.comments).toEqual([]);
    expect(createdIdea.statusHistory).toHaveLength(1);
    expect(createdIdea.statusHistory[0].status).toBe('Pending Review');
    expect(createdIdea.statusHistory[0].changedBy).toBe('user-123');
    expect(createdIdea.createdAt).toBeDefined();
    expect(createdIdea.updatedAt).toBeDefined();
  });

  test('should generate unique idea IDs', async () => {
    jest.spyOn(db, 'createIdea').mockResolvedValue();
    jest.spyOn(db, 'userExists').mockResolvedValue(true);

    const event1 = createEvent({
      title: 'First idea',
      description: 'Description 1',
      submitterId: 'user-123'
    });

    const event2 = createEvent({
      title: 'Second idea',
      description: 'Description 2',
      submitterId: 'user-123'
    });

    const result1 = await handler(event1);
    const result2 = await handler(event2);

    const body1 = JSON.parse(result1.body);
    const body2 = JSON.parse(result2.body);

    expect(body1.ideaId).not.toBe(body2.ideaId);
  });

  test('should return validation error when title is missing', async () => {
    const event = createEvent({
      description: 'Description without title',
      submitterId: 'user-123'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Title');
  });

  test('should return validation error when description is missing', async () => {
    const event = createEvent({
      title: 'Title without description',
      submitterId: 'user-123'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Description');
  });

  test('should return validation error when submitterId is missing', async () => {
    const event = createEvent({
      title: 'Title',
      description: 'Description'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Submitter ID');
  });

  test('should return error for invalid JSON', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      path: '/ideas',
      body: 'invalid json{',
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  test('should set initial status to Pending Review', async () => {
    const mockCreateIdea = jest.spyOn(db, 'createIdea').mockResolvedValue();
    jest.spyOn(db, 'userExists').mockResolvedValue(true);

    const event = createEvent({
      title: 'Test idea',
      description: 'Test description',
      submitterId: 'user-123'
    });

    await handler(event);

    const createdIdea = mockCreateIdea.mock.calls[0][0];
    expect(createdIdea.status).toBe('Pending Review');
  });

  test('should record submitter ID and timestamps', async () => {
    const mockCreateIdea = jest.spyOn(db, 'createIdea').mockResolvedValue();
    jest.spyOn(db, 'userExists').mockResolvedValue(true);

    const event = createEvent({
      title: 'Test idea',
      description: 'Test description',
      submitterId: 'user-456'
    });

    await handler(event);

    const createdIdea = mockCreateIdea.mock.calls[0][0];
    expect(createdIdea.submitterId).toBe('user-456');
    expect(createdIdea.createdAt).toBeDefined();
    expect(createdIdea.updatedAt).toBeDefined();
    expect(createdIdea.createdAt).toBe(createdIdea.updatedAt);
  });

  test('should handle database errors gracefully', async () => {
    jest.spyOn(db, 'createIdea').mockRejectedValue(new Error('DynamoDB error'));
    jest.spyOn(db, 'userExists').mockResolvedValue(true);

    const event = createEvent({
      title: 'Test idea',
      description: 'Test description',
      submitterId: 'user-123'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  test('should return 404 when submitter does not exist', async () => {
    jest.spyOn(db, 'userExists').mockResolvedValue(false);

    const event = createEvent({
      title: 'Test idea',
      description: 'Test description',
      submitterId: 'nonexistent-user'
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Submitter with ID nonexistent-user not found');
  });
});
