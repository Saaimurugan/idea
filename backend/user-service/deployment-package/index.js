"use strict";
/**
 * User Service Lambda Function
 *
 * Handles all user CRUD operations and authentication for the Employee Ideas Management System.
 *
 * Endpoints:
 * - POST /auth/login - Authenticate user
 * - POST /users - Create user (Admin only)
 * - GET /users - List users (Admin/Reviewer)
 * - GET /users/{userId} - Get user by ID
 * - PUT /users/{userId} - Update user (Admin only)
 * - DELETE /users/{userId} - Delete user (Admin only)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const validation_1 = require("./validation");
const db_1 = require("./db");
const auth_1 = require("./auth");
/**
 * Common response headers
 */
const RESPONSE_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
/**
 * Create error response
 */
function errorResponse(statusCode, code, message, details) {
    const response = {
        error: {
            code,
            message,
            details
        }
    };
    return {
        statusCode,
        headers: RESPONSE_HEADERS,
        body: JSON.stringify(response)
    };
}
/**
 * Create success response
 */
function successResponse(statusCode, data) {
    return {
        statusCode,
        headers: RESPONSE_HEADERS,
        body: JSON.stringify(data)
    };
}
/**
 * Remove passwordHash from user object for API responses
 */
function sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
}
/**
 * Generate JWT token for authenticated user
 */
function generateToken(payload) {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h');
    return jwt.sign(payload, secret, { expiresIn });
}
/**
 * Handle POST /auth/login - Authenticate user
 */
async function handleLogin(event) {
    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        // Validate request
        (0, validation_1.validateLoginRequest)(body);
        // Get user by username
        const user = await (0, db_1.getUserByUsername)(body.username);
        if (!user) {
            console.warn('Login attempt with invalid username:', body.username);
            return errorResponse(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
        }
        // Verify password
        const passwordMatch = await bcryptjs_1.default.compare(body.password, user.passwordHash);
        if (!passwordMatch) {
            console.warn('Login attempt with invalid password for user:', body.username);
            return errorResponse(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
        }
        // Generate session token
        const tokenPayload = {
            userId: user.userId,
            username: user.username,
            role: user.role
        };
        const token = generateToken(tokenPayload);
        // Return success response
        const response = {
            token,
            userId: user.userId,
            role: user.role
        };
        console.log('User logged in successfully:', user.userId);
        return successResponse(200, response);
    }
    catch (error) {
        // Safe username extraction for logging
        let username = 'unknown';
        try {
            if (event.body) {
                const parsed = JSON.parse(event.body);
                username = parsed.username || 'unknown';
            }
        }
        catch {
            // Ignore JSON parse errors in logging
        }
        console.error('Error during login:', {
            error: error.message,
            stack: error.stack,
            username
        });
        if (error instanceof validation_1.ValidationError) {
            return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
        }
        if (error instanceof SyntaxError) {
            return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
        }
        // Check for DynamoDB errors
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during login');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during login');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Handle POST /users - Create new user
 */
async function handleCreateUser(event) {
    try {
        // Require Admin role
        const authResult = (0, auth_1.requireRole)(event, ['Admin']);
        if ((0, auth_1.isErrorResponse)(authResult)) {
            return authResult;
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        // Validate request
        (0, validation_1.validateCreateUserRequest)(body);
        // Check username uniqueness
        const existingUser = await (0, db_1.getUserByUsername)(body.username);
        if (existingUser) {
            console.warn('Attempt to create user with duplicate username:', body.username);
            return errorResponse(409, 'DUPLICATE_USERNAME', 'A user with this username already exists');
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(body.password, 10);
        // Create user object
        const now = new Date().toISOString();
        const user = {
            userId: (0, uuid_1.v4)(),
            username: body.username,
            email: body.email,
            passwordHash,
            role: body.role,
            createdAt: now,
            updatedAt: now
        };
        // Save to DynamoDB
        await (0, db_1.createUser)(user);
        console.log('User created successfully:', user.userId);
        // Return success with userId
        return successResponse(201, { userId: user.userId });
    }
    catch (error) {
        // Safe username extraction for logging
        let username = 'unknown';
        try {
            if (event.body) {
                const parsed = JSON.parse(event.body);
                username = parsed.username || 'unknown';
            }
        }
        catch {
            // Ignore JSON parse errors in logging
        }
        console.error('Error creating user:', {
            error: error.message,
            stack: error.stack,
            username
        });
        if (error instanceof validation_1.ValidationError) {
            return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
        }
        if (error instanceof SyntaxError) {
            return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
        }
        // Check for DynamoDB errors
        if (error.name === 'ConditionalCheckFailedException') {
            console.error('Conditional check failed during user creation');
            return errorResponse(409, 'CONFLICT', 'User already exists');
        }
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during user creation');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during user creation');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Handle GET /users - List all users or filter by role
 */
async function handleListUsers(event) {
    try {
        // Get role filter from query parameters
        const roleFilter = event.queryStringParameters?.role;
        // Authorization check
        let authResult;
        if (roleFilter) {
            // Reviewer can filter by role (specifically for Implementers)
            // Admin can filter by any role
            authResult = (0, auth_1.requireRole)(event, ['Admin', 'Reviewer']);
        }
        else {
            // Listing all users requires Admin role
            authResult = (0, auth_1.requireRole)(event, ['Admin']);
        }
        if ((0, auth_1.isErrorResponse)(authResult)) {
            return authResult;
        }
        // Fetch users
        let users;
        if (roleFilter) {
            console.log('Fetching users with role filter:', roleFilter);
            users = await (0, db_1.getUsersByRole)(roleFilter);
        }
        else {
            console.log('Fetching all users');
            users = await (0, db_1.getAllUsers)();
        }
        // Remove passwordHash from responses
        const sanitizedUsers = users.map(sanitizeUser);
        console.log('Users retrieved successfully, count:', users.length);
        return successResponse(200, { users: sanitizedUsers });
    }
    catch (error) {
        console.error('Error listing users:', {
            error: error.message,
            stack: error.stack,
            roleFilter: event.queryStringParameters?.role
        });
        // Check for DynamoDB errors
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during user listing');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during user listing');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Handle GET /users/{userId} - Get single user by ID
 */
async function handleGetUser(event) {
    try {
        // Require authentication
        const authResult = (0, auth_1.requireAuth)(event);
        if ((0, auth_1.isErrorResponse)(authResult)) {
            return authResult;
        }
        // Extract userId from path
        const userId = event.pathParameters?.userId;
        if (!userId) {
            return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
        }
        // Fetch user
        const user = await (0, db_1.getUserById)(userId);
        if (!user) {
            console.warn('User not found:', userId);
            return errorResponse(404, 'NOT_FOUND', 'User not found');
        }
        // Remove passwordHash from response
        const sanitizedUser = sanitizeUser(user);
        console.log('User retrieved successfully:', userId);
        return successResponse(200, { user: sanitizedUser });
    }
    catch (error) {
        console.error('Error getting user:', {
            error: error.message,
            stack: error.stack,
            userId: event.pathParameters?.userId
        });
        // Check for DynamoDB errors
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during user retrieval');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during user retrieval');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Handle PUT /users/{userId} - Update user
 */
async function handleUpdateUser(event) {
    try {
        // Require Admin role
        const authResult = (0, auth_1.requireRole)(event, ['Admin']);
        if ((0, auth_1.isErrorResponse)(authResult)) {
            return authResult;
        }
        // Extract userId from path
        const userId = event.pathParameters?.userId;
        if (!userId) {
            return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        // Validate request
        (0, validation_1.validateUpdateUserRequest)(body);
        // Check if user exists
        const existingUser = await (0, db_1.getUserById)(userId);
        if (!existingUser) {
            console.warn('Attempt to update non-existent user:', userId);
            return errorResponse(404, 'NOT_FOUND', 'User not found');
        }
        // Prepare updates
        const updates = {
            updatedAt: new Date().toISOString()
        };
        if (body.email !== undefined) {
            updates.email = body.email;
        }
        if (body.role !== undefined) {
            updates.role = body.role;
        }
        if (body.password !== undefined) {
            // Hash new password
            updates.passwordHash = await bcryptjs_1.default.hash(body.password, 10);
        }
        // Update user in DynamoDB
        await (0, db_1.updateUser)(userId, updates);
        console.log('User updated successfully:', userId);
        return successResponse(200, { success: true });
    }
    catch (error) {
        console.error('Error updating user:', {
            error: error.message,
            stack: error.stack,
            userId: event.pathParameters?.userId
        });
        if (error instanceof validation_1.ValidationError) {
            return errorResponse(400, 'VALIDATION_ERROR', error.message, error.details);
        }
        if (error instanceof SyntaxError) {
            return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
        }
        // Check for DynamoDB errors
        if (error.name === 'ConditionalCheckFailedException') {
            console.error('User not found during update (conditional check failed):', event.pathParameters?.userId);
            return errorResponse(404, 'NOT_FOUND', 'User not found');
        }
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during user update');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during user update');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Handle DELETE /users/{userId} - Delete user
 */
async function handleDeleteUser(event) {
    try {
        // Require Admin role
        const authResult = (0, auth_1.requireRole)(event, ['Admin']);
        if ((0, auth_1.isErrorResponse)(authResult)) {
            return authResult;
        }
        // Extract userId from path
        const userId = event.pathParameters?.userId;
        if (!userId) {
            return errorResponse(400, 'INVALID_REQUEST', 'User ID is required');
        }
        // Delete user from DynamoDB
        // The deleteUser function will throw if user doesn't exist (ConditionExpression)
        try {
            await (0, db_1.deleteUser)(userId);
            console.log('User deleted successfully:', userId);
        }
        catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                console.warn('Attempt to delete non-existent user:', userId);
                return errorResponse(404, 'NOT_FOUND', 'User not found');
            }
            throw error;
        }
        return successResponse(200, { success: true });
    }
    catch (error) {
        console.error('Error deleting user:', {
            error: error.message,
            stack: error.stack,
            userId: event.pathParameters?.userId
        });
        // Check for DynamoDB errors
        if (error.name === 'ResourceNotFoundException') {
            console.error('DynamoDB table not found during user deletion');
            return errorResponse(500, 'DATABASE_ERROR', 'Database configuration error');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded during user deletion');
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, please try again');
        }
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
}
/**
 * Lambda handler function
 */
const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    const { httpMethod, path } = event;
    try {
        // Handle OPTIONS for CORS
        if (httpMethod === 'OPTIONS') {
            return successResponse(200, {});
        }
        // Route to appropriate handler
        if (httpMethod === 'POST' && path === '/auth/login') {
            return await handleLogin(event);
        }
        if (httpMethod === 'POST' && path === '/users') {
            return await handleCreateUser(event);
        }
        if (httpMethod === 'GET' && path === '/users') {
            return await handleListUsers(event);
        }
        if (httpMethod === 'GET' && path.startsWith('/users/')) {
            return await handleGetUser(event);
        }
        if (httpMethod === 'PUT' && path.startsWith('/users/')) {
            return await handleUpdateUser(event);
        }
        if (httpMethod === 'DELETE' && path.startsWith('/users/')) {
            return await handleDeleteUser(event);
        }
        // Unknown route
        console.warn('Unknown route requested:', { httpMethod, path });
        return errorResponse(404, 'NOT_FOUND', 'Endpoint not found');
    }
    catch (error) {
        console.error('Unhandled error in Lambda handler:', {
            error: error.message,
            stack: error.stack,
            httpMethod,
            path
        });
        return errorResponse(500, 'INTERNAL_ERROR', 'An internal error occurred');
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map