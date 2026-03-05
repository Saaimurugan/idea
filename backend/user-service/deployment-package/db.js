"use strict";
/**
 * DynamoDB client wrapper for user operations
 *
 * Provides CRUD operations for the Users table with proper error handling
 * and type safety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUserById = getUserById;
exports.getUserByUsername = getUserByUsername;
exports.getAllUsers = getAllUsers;
exports.getUsersByRole = getUsersByRole;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'Users';
/**
 * Create a new user in DynamoDB
 * Ensures write completes successfully and enforces userId uniqueness
 * Note: Username uniqueness must be checked by caller using getUserByUsername before calling this
 */
async function createUser(user) {
    try {
        // Use PutCommand with condition to enforce userId uniqueness
        const result = await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: USERS_TABLE,
            Item: user,
            // Check that no item with this userId exists (prevents overwrites)
            ConditionExpression: 'attribute_not_exists(userId)',
            ReturnValues: 'NONE'
        }));
        // Verify the write was acknowledged by DynamoDB
        // If we reach here without exception, the write succeeded
        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error(`DynamoDB write failed with status: ${result.$metadata.httpStatusCode}`);
        }
    }
    catch (error) {
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
async function getUserById(userId) {
    const result = await docClient.send(new lib_dynamodb_1.GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
    }));
    return result.Item;
}
/**
 * Get user by username using GSI
 */
async function getUserByUsername(username) {
    const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'username-index',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        }
    }));
    return result.Items?.[0];
}
/**
 * Get all users
 */
async function getAllUsers() {
    const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
        TableName: USERS_TABLE
    }));
    return result.Items || [];
}
/**
 * Get users by role using GSI
 */
async function getUsersByRole(role) {
    const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'role-index',
        KeyConditionExpression: 'role = :role',
        ExpressionAttributeValues: {
            ':role': role
        }
    }));
    return result.Items || [];
}
/**
 * Update user fields
 * Ensures write completes successfully before returning
 */
async function updateUser(userId, updates) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    Object.entries(updates).forEach(([key, value]) => {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
    });
    if (updateExpressions.length === 0) {
        return;
    }
    try {
        const result = await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(userId)',
            ReturnValues: 'NONE'
        }));
        // Verify the write was acknowledged by DynamoDB
        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error(`DynamoDB update failed with status: ${result.$metadata.httpStatusCode}`);
        }
    }
    catch (error) {
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
async function deleteUser(userId) {
    try {
        const result = await docClient.send(new lib_dynamodb_1.DeleteCommand({
            TableName: USERS_TABLE,
            Key: { userId },
            ConditionExpression: 'attribute_exists(userId)',
            ReturnValues: 'NONE'
        }));
        // Verify the write was acknowledged by DynamoDB
        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error(`DynamoDB delete failed with status: ${result.$metadata.httpStatusCode}`);
        }
    }
    catch (error) {
        // Re-throw ConditionalCheckFailedException for not found handling
        if (error.name === 'ConditionalCheckFailedException') {
            throw error;
        }
        // Re-throw other errors
        throw error;
    }
}
//# sourceMappingURL=db.js.map