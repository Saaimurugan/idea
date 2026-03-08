/**
 * DynamoDB client wrapper for idea operations
 * 
 * Provides CRUD operations for the Ideas table with proper error handling
 * and type safety.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { Idea } from './types';

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Handle DynamoDB errors and convert to DatabaseError
 */
function handleDynamoDBError(error: any, operation: string, context: string): never {
  console.error(`DynamoDB ${operation} error in ${context}:`, {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.$metadata?.httpStatusCode
  });

  // Handle specific DynamoDB error types
  if (error.name === 'ConditionalCheckFailedException') {
    throw new DatabaseError(
      `Conditional check failed: ${context}`,
      'CONDITIONAL_CHECK_FAILED',
      error
    );
  }

  if (error.name === 'ResourceNotFoundException') {
    throw new DatabaseError(
      `Table not found: ${context}`,
      'TABLE_NOT_FOUND',
      error
    );
  }

  if (error.name === 'ProvisionedThroughputExceededException') {
    throw new DatabaseError(
      'Database throughput exceeded, please try again',
      'THROUGHPUT_EXCEEDED',
      error
    );
  }

  if (error.name === 'ValidationException') {
    throw new DatabaseError(
      `Invalid database operation: ${error.message}`,
      'INVALID_OPERATION',
      error
    );
  }

  if (error.name === 'ItemCollectionSizeLimitExceededException') {
    throw new DatabaseError(
      'Item collection size limit exceeded',
      'SIZE_LIMIT_EXCEEDED',
      error
    );
  }

  if (error.name === 'RequestLimitExceeded') {
    throw new DatabaseError(
      'Too many requests, please try again later',
      'REQUEST_LIMIT_EXCEEDED',
      error
    );
  }

  if (error.name === 'InternalServerError' || error.name === 'ServiceUnavailable') {
    throw new DatabaseError(
      'Database service temporarily unavailable',
      'SERVICE_UNAVAILABLE',
      error
    );
  }

  // Generic database error
  throw new DatabaseError(
    'Database operation failed',
    'DATABASE_ERROR',
    error
  );
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const IDEAS_TABLE = process.env.IDEAS_TABLE_NAME || 'Ideas';
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';

/**
 * Create a new idea in DynamoDB
 */
export async function createIdea(idea: Idea): Promise<void> {
  try {
    console.log(`Creating idea with ID: ${idea.ideaId}`);
    
    await docClient.send(
      new PutCommand({
        TableName: IDEAS_TABLE,
        Item: idea,
        ConditionExpression: 'attribute_not_exists(ideaId)'
      })
    );
    
    console.log(`Successfully created idea: ${idea.ideaId}`);
  } catch (error) {
    handleDynamoDBError(error, 'PutItem', `createIdea(${idea.ideaId})`);
  }
}

/**
 * Get idea by ideaId
 */
export async function getIdeaById(ideaId: string): Promise<Idea | null> {
  try {
    console.log(`Retrieving idea with ID: ${ideaId}`);
    
    const result = await docClient.send(
      new GetCommand({
        TableName: IDEAS_TABLE,
        Key: { ideaId }
      })
    );
    
    if (result.Item) {
      console.log(`Successfully retrieved idea: ${ideaId}`);
    } else {
      console.log(`Idea not found: ${ideaId}`);
    }
    
    return result.Item as Idea | null;
  } catch (error) {
    handleDynamoDBError(error, 'GetItem', `getIdeaById(${ideaId})`);
  }
}

/**
 * Get all ideas
 */
export async function getAllIdeas(): Promise<Idea[]> {
  try {
    console.log('Retrieving all ideas');
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: IDEAS_TABLE
      })
    );
    
    const ideas = result.Items as Idea[] || [];
    console.log(`Successfully retrieved ${ideas.length} ideas`);
    
    return ideas;
  } catch (error) {
    handleDynamoDBError(error, 'Scan', 'getAllIdeas()');
  }
}

/**
 * Get ideas by submitter using GSI
 */
export async function getIdeasBySubmitter(submitterId: string): Promise<Idea[]> {
  try {
    console.log(`Retrieving ideas for submitter: ${submitterId}`);
    
    const result = await docClient.send(
      new QueryCommand({
        TableName: IDEAS_TABLE,
        IndexName: 'submitter-index',
        KeyConditionExpression: 'submitterId = :submitterId',
        ExpressionAttributeValues: {
          ':submitterId': submitterId
        }
      })
    );
    
    const ideas = result.Items as Idea[] || [];
    console.log(`Successfully retrieved ${ideas.length} ideas for submitter: ${submitterId}`);
    
    return ideas;
  } catch (error) {
    handleDynamoDBError(error, 'Query', `getIdeasBySubmitter(${submitterId})`);
  }
}

/**
 * Get ideas by assignee using GSI
 */
export async function getIdeasByAssignee(assigneeId: string): Promise<Idea[]> {
  try {
    console.log(`Retrieving ideas for assignee: ${assigneeId}`);
    
    const result = await docClient.send(
      new QueryCommand({
        TableName: IDEAS_TABLE,
        IndexName: 'assignee-index',
        KeyConditionExpression: 'assigneeId = :assigneeId',
        ExpressionAttributeValues: {
          ':assigneeId': assigneeId
        }
      })
    );
    
    const ideas = result.Items as Idea[] || [];
    console.log(`Successfully retrieved ${ideas.length} ideas for assignee: ${assigneeId}`);
    
    return ideas;
  } catch (error) {
    handleDynamoDBError(error, 'Query', `getIdeasByAssignee(${assigneeId})`);
  }
}

/**
 * Get ideas by status using GSI
 */
export async function getIdeasByStatus(status: string): Promise<Idea[]> {
  try {
    console.log(`Retrieving ideas with status: ${status}`);
    
    const result = await docClient.send(
      new QueryCommand({
        TableName: IDEAS_TABLE,
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        }
      })
    );
    
    const ideas = result.Items as Idea[] || [];
    console.log(`Successfully retrieved ${ideas.length} ideas with status: ${status}`);
    
    return ideas;
  } catch (error) {
    handleDynamoDBError(error, 'Query', `getIdeasByStatus(${status})`);
  }
}

/**
 * Update idea fields
 */
export async function updateIdea(
  ideaId: string,
  updates: Partial<Omit<Idea, 'ideaId' | 'createdAt'>>
): Promise<void> {
  try {
    console.log(`Updating idea: ${ideaId}`, { updates: Object.keys(updates) });
    
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });
    
    if (updateExpressions.length === 0) {
      console.log(`No updates provided for idea: ${ideaId}`);
      return;
    }
    
    await docClient.send(
      new UpdateCommand({
        TableName: IDEAS_TABLE,
        Key: { ideaId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(ideaId)'
      })
    );
    
    console.log(`Successfully updated idea: ${ideaId}`);
  } catch (error) {
    handleDynamoDBError(error, 'UpdateItem', `updateIdea(${ideaId})`);
  }
}

/**
 * Check if a user exists in the Users table
 */
export async function userExists(userId: string): Promise<boolean> {
  try {
    console.log(`Checking if user exists: ${userId}`);
    
    const result = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      })
    );
    
    const exists = !!result.Item;
    console.log(`User ${userId} exists: ${exists}`);
    
    return exists;
  } catch (error) {
    handleDynamoDBError(error, 'GetItem', `userExists(${userId})`);
  }
}

/**
 * Delete idea by ID
 * Ensures write completes successfully before returning
 */
export async function deleteIdea(ideaId: string): Promise<void> {
  try {
    console.log(`Deleting idea: ${ideaId}`);
    
    const result = await docClient.send(
      new DeleteCommand({
        TableName: IDEAS_TABLE,
        Key: { ideaId },
        ConditionExpression: 'attribute_exists(ideaId)',
        ReturnValues: 'NONE'
      })
    );
    
    // Verify the write was acknowledged by DynamoDB
    if (result.$metadata.httpStatusCode !== 200) {
      throw new DatabaseError(
        `DynamoDB delete failed with status: ${result.$metadata.httpStatusCode}`,
        'DELETE_FAILED'
      );
    }
    
    console.log(`Successfully deleted idea: ${ideaId}`);
  } catch (error) {
    handleDynamoDBError(error, 'DeleteItem', `deleteIdea(${ideaId})`);
  }
}
