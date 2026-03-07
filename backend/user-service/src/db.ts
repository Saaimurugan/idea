/**
 * DynamoDB client wrapper for user operations
 * 
 * Provides CRUD operations for the Users table with proper error handling
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
import { User } from './types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';

/**
 * Create a new user in DynamoDB
 * Ensures write completes successfully and enforces userId uniqueness
 * Note: Username uniqueness must be checked by caller using getUserByUsername before calling this
 */
export async function createUser(user: User): Promise<void> {
  try {
    // Use PutCommand with condition to enforce userId uniqueness
    const result = await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: user,
        // Check that no item with this userId exists (prevents overwrites)
        ConditionExpression: 'attribute_not_exists(userId)',
        ReturnValues: 'NONE'
      })
    );
    
    // Verify the write was acknowledged by DynamoDB
    // If we reach here without exception, the write succeeded
    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(`DynamoDB write failed with status: ${result.$metadata.httpStatusCode}`);
    }
  } catch (error: any) {
    // Re-throw ConditionalCheckFailedException for uniqueness handling
    if (error.name === 'ConditionalCheckFailedException') {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Get user by userId
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    })
  );
  
  return result.Item as User | null;
}

/**
 * Get user by username using GSI
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    })
  );
  
  return result.Items?.[0] as User | null;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: USERS_TABLE
    })
  );
  
  return result.Items as User[] || [];
}

/**
 * Get users by role using GSI
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'role-index',
      KeyConditionExpression: 'role = :role',
      ExpressionAttributeValues: {
        ':role': role
      }
    })
  );
  
  return result.Items as User[] || [];
}

/**
 * Update user fields
 * Ensures write completes successfully before returning
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'userId' | 'createdAt'>>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  Object.entries(updates).forEach(([key, value]) => {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  });
  
  if (updateExpressions.length === 0) {
    return;
  }
  
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'NONE'
      })
    );
    
    // Verify the write was acknowledged by DynamoDB
    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(`DynamoDB update failed with status: ${result.$metadata.httpStatusCode}`);
    }
  } catch (error: any) {
    // Re-throw ConditionalCheckFailedException for not found handling
    if (error.name === 'ConditionalCheckFailedException') {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Delete user by userId
 * Ensures write completes successfully before returning
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const result = await docClient.send(
      new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'NONE'
      })
    );
    
    // Verify the write was acknowledged by DynamoDB
    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(`DynamoDB delete failed with status: ${result.$metadata.httpStatusCode}`);
    }
  } catch (error: any) {
    // Re-throw ConditionalCheckFailedException for not found handling
    if (error.name === 'ConditionalCheckFailedException') {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}
