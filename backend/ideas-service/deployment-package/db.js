"use strict";
/**
 * DynamoDB client wrapper for idea operations
 *
 * Provides CRUD operations for the Ideas table with proper error handling
 * and type safety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = void 0;
exports.createIdea = createIdea;
exports.getIdeaById = getIdeaById;
exports.getAllIdeas = getAllIdeas;
exports.getIdeasBySubmitter = getIdeasBySubmitter;
exports.getIdeasByAssignee = getIdeasByAssignee;
exports.getIdeasByStatus = getIdeasByStatus;
exports.updateIdea = updateIdea;
exports.userExists = userExists;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * Custom error class for database operations
 */
class DatabaseError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Handle DynamoDB errors and convert to DatabaseError
 */
function handleDynamoDBError(error, operation, context) {
    console.error(`DynamoDB ${operation} error in ${context}:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode
    });
    // Handle specific DynamoDB error types
    if (error.name === 'ConditionalCheckFailedException') {
        throw new DatabaseError(`Conditional check failed: ${context}`, 'CONDITIONAL_CHECK_FAILED', error);
    }
    if (error.name === 'ResourceNotFoundException') {
        throw new DatabaseError(`Table not found: ${context}`, 'TABLE_NOT_FOUND', error);
    }
    if (error.name === 'ProvisionedThroughputExceededException') {
        throw new DatabaseError('Database throughput exceeded, please try again', 'THROUGHPUT_EXCEEDED', error);
    }
    if (error.name === 'ValidationException') {
        throw new DatabaseError(`Invalid database operation: ${error.message}`, 'INVALID_OPERATION', error);
    }
    if (error.name === 'ItemCollectionSizeLimitExceededException') {
        throw new DatabaseError('Item collection size limit exceeded', 'SIZE_LIMIT_EXCEEDED', error);
    }
    if (error.name === 'RequestLimitExceeded') {
        throw new DatabaseError('Too many requests, please try again later', 'REQUEST_LIMIT_EXCEEDED', error);
    }
    if (error.name === 'InternalServerError' || error.name === 'ServiceUnavailable') {
        throw new DatabaseError('Database service temporarily unavailable', 'SERVICE_UNAVAILABLE', error);
    }
    // Generic database error
    throw new DatabaseError('Database operation failed', 'DATABASE_ERROR', error);
}
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const IDEAS_TABLE = process.env.IDEAS_TABLE_NAME || 'Ideas';
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';
/**
 * Create a new idea in DynamoDB
 */
async function createIdea(idea) {
    try {
        console.log(`Creating idea with ID: ${idea.ideaId}`);
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: IDEAS_TABLE,
            Item: idea,
            ConditionExpression: 'attribute_not_exists(ideaId)'
        }));
        console.log(`Successfully created idea: ${idea.ideaId}`);
    }
    catch (error) {
        handleDynamoDBError(error, 'PutItem', `createIdea(${idea.ideaId})`);
    }
}
/**
 * Get idea by ideaId
 */
async function getIdeaById(ideaId) {
    try {
        console.log(`Retrieving idea with ID: ${ideaId}`);
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: IDEAS_TABLE,
            Key: { ideaId }
        }));
        if (result.Item) {
            console.log(`Successfully retrieved idea: ${ideaId}`);
        }
        else {
            console.log(`Idea not found: ${ideaId}`);
        }
        return result.Item;
    }
    catch (error) {
        handleDynamoDBError(error, 'GetItem', `getIdeaById(${ideaId})`);
    }
}
/**
 * Get all ideas
 */
async function getAllIdeas() {
    try {
        console.log('Retrieving all ideas');
        const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
            TableName: IDEAS_TABLE
        }));
        const ideas = result.Items || [];
        console.log(`Successfully retrieved ${ideas.length} ideas`);
        return ideas;
    }
    catch (error) {
        handleDynamoDBError(error, 'Scan', 'getAllIdeas()');
    }
}
/**
 * Get ideas by submitter using GSI
 */
async function getIdeasBySubmitter(submitterId) {
    try {
        console.log(`Retrieving ideas for submitter: ${submitterId}`);
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: IDEAS_TABLE,
            IndexName: 'submitter-index',
            KeyConditionExpression: 'submitterId = :submitterId',
            ExpressionAttributeValues: {
                ':submitterId': submitterId
            }
        }));
        const ideas = result.Items || [];
        console.log(`Successfully retrieved ${ideas.length} ideas for submitter: ${submitterId}`);
        return ideas;
    }
    catch (error) {
        handleDynamoDBError(error, 'Query', `getIdeasBySubmitter(${submitterId})`);
    }
}
/**
 * Get ideas by assignee using GSI
 */
async function getIdeasByAssignee(assigneeId) {
    try {
        console.log(`Retrieving ideas for assignee: ${assigneeId}`);
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: IDEAS_TABLE,
            IndexName: 'assignee-index',
            KeyConditionExpression: 'assigneeId = :assigneeId',
            ExpressionAttributeValues: {
                ':assigneeId': assigneeId
            }
        }));
        const ideas = result.Items || [];
        console.log(`Successfully retrieved ${ideas.length} ideas for assignee: ${assigneeId}`);
        return ideas;
    }
    catch (error) {
        handleDynamoDBError(error, 'Query', `getIdeasByAssignee(${assigneeId})`);
    }
}
/**
 * Get ideas by status using GSI
 */
async function getIdeasByStatus(status) {
    try {
        console.log(`Retrieving ideas with status: ${status}`);
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: IDEAS_TABLE,
            IndexName: 'status-index',
            KeyConditionExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status
            }
        }));
        const ideas = result.Items || [];
        console.log(`Successfully retrieved ${ideas.length} ideas with status: ${status}`);
        return ideas;
    }
    catch (error) {
        handleDynamoDBError(error, 'Query', `getIdeasByStatus(${status})`);
    }
}
/**
 * Update idea fields
 */
async function updateIdea(ideaId, updates) {
    try {
        console.log(`Updating idea: ${ideaId}`, { updates: Object.keys(updates) });
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        Object.entries(updates).forEach(([key, value]) => {
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        });
        if (updateExpressions.length === 0) {
            console.log(`No updates provided for idea: ${ideaId}`);
            return;
        }
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: IDEAS_TABLE,
            Key: { ideaId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(ideaId)'
        }));
        console.log(`Successfully updated idea: ${ideaId}`);
    }
    catch (error) {
        handleDynamoDBError(error, 'UpdateItem', `updateIdea(${ideaId})`);
    }
}
/**
 * Check if a user exists in the Users table
 */
async function userExists(userId) {
    try {
        console.log(`Checking if user exists: ${userId}`);
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));
        const exists = !!result.Item;
        console.log(`User ${userId} exists: ${exists}`);
        return exists;
    }
    catch (error) {
        handleDynamoDBError(error, 'GetItem', `userExists(${userId})`);
    }
}
//# sourceMappingURL=db.js.map