"use strict";
/**
 * Authorization middleware for Ideas Service
 *
 * Provides JWT token validation and role-based access control.
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
//# sourceMappingURL=auth.js.map