"use strict";
/**
 * Authorization middleware for User Service
 *
 * Provides JWT token validation and role-based access control.
 *
 * Validates Requirement 1.3: System SHALL authorize access to features based on user's assigned role
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = validateToken;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.isErrorResponse = isErrorResponse;
const jwt = __importStar(require("jsonwebtoken"));
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
 * Validate JWT token and extract user information
 *
 * @param event - API Gateway event
 * @returns AuthContext if token is valid, null otherwise
 */
function validateToken(event) {
    try {
        // Extract Authorization header
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader) {
            return null;
        }
        // Check Bearer token format
        const match = authHeader.match(/^Bearer (.+)$/);
        if (!match) {
            return null;
        }
        const token = match[1];
        // Get JWT secret from environment
        const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        // Verify and decode token
        const decoded = jwt.verify(token, secret);
        // Validate required fields
        if (!decoded.userId || !decoded.username || !decoded.role) {
            return null;
        }
        // Return auth context
        return {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
    }
    catch (error) {
        // Token verification failed (expired, invalid signature, etc.)
        console.error('Token validation error:', error);
        return null;
    }
}
/**
 * Middleware to require authentication
 *
 * Returns 401 error if token is missing or invalid
 *
 * @param event - API Gateway event
 * @returns AuthContext if authenticated, error response otherwise
 */
function requireAuth(event) {
    const authContext = validateToken(event);
    if (!authContext) {
        return errorResponse(401, 'UNAUTHORIZED', 'Authentication required. Please provide a valid token.');
    }
    return authContext;
}
/**
 * Middleware to require specific role(s)
 *
 * Returns 401 if not authenticated, 403 if insufficient permissions
 *
 * @param event - API Gateway event
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns AuthContext if authorized, error response otherwise
 */
function requireRole(event, allowedRoles) {
    // First check authentication
    const authResult = requireAuth(event);
    // If requireAuth returned an error response, return it
    if ('statusCode' in authResult) {
        return authResult;
    }
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(authResult.role)) {
        return errorResponse(403, 'FORBIDDEN', `Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }
    return authResult;
}
/**
 * Check if auth result is an error response
 *
 * Type guard to distinguish between AuthContext and error response
 */
function isErrorResponse(result) {
    return 'statusCode' in result;
}
//# sourceMappingURL=auth.js.map