"use strict";
/**
 * Input validation utilities for user data
 *
 * Provides validation functions for user-related inputs to ensure data integrity
 * before persistence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.isValidEmail = isValidEmail;
exports.isValidUsername = isValidUsername;
exports.isValidPassword = isValidPassword;
exports.isValidRole = isValidRole;
exports.validateCreateUserRequest = validateCreateUserRequest;
exports.validateUpdateUserRequest = validateUpdateUserRequest;
exports.validateLoginRequest = validateLoginRequest;
/**
 * Valid user roles
 */
const VALID_ROLES = ['Employee', 'Reviewer', 'Implementer', 'Admin'];
/**
 * Validation error class
 */
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate username format
 */
function isValidUsername(username) {
    return username.length >= 1 && username.length <= 50;
}
/**
 * Validate password strength
 */
function isValidPassword(password) {
    return password.length >= 8;
}
/**
 * Validate user role
 */
function isValidRole(role) {
    return VALID_ROLES.includes(role);
}
/**
 * Validate user creation request
 */
function validateCreateUserRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new ValidationError('Request body must be an object');
    }
    // Validate username
    if (!request.username || typeof request.username !== 'string') {
        throw new ValidationError('Username is required and must be a string');
    }
    if (!isValidUsername(request.username)) {
        throw new ValidationError('Username must be between 1 and 50 characters');
    }
    // Validate email
    if (!request.email || typeof request.email !== 'string') {
        throw new ValidationError('Email is required and must be a string');
    }
    if (!isValidEmail(request.email)) {
        throw new ValidationError('Email must be a valid email address');
    }
    // Validate password
    if (!request.password || typeof request.password !== 'string') {
        throw new ValidationError('Password is required and must be a string');
    }
    if (!isValidPassword(request.password)) {
        throw new ValidationError('Password must be at least 8 characters long');
    }
    // Validate role
    if (!request.role || typeof request.role !== 'string') {
        throw new ValidationError('Role is required and must be a string');
    }
    if (!isValidRole(request.role)) {
        throw new ValidationError(`Role must be one of: ${VALID_ROLES.join(', ')}`, { validRoles: VALID_ROLES });
    }
}
/**
 * Validate user update request
 */
function validateUpdateUserRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new ValidationError('Request body must be an object');
    }
    // At least one field must be provided
    if (!request.email && !request.role && !request.password) {
        throw new ValidationError('At least one field (email, role, or password) must be provided');
    }
    // Validate email if provided
    if (request.email !== undefined) {
        if (typeof request.email !== 'string') {
            throw new ValidationError('Email must be a string');
        }
        if (!isValidEmail(request.email)) {
            throw new ValidationError('Email must be a valid email address');
        }
    }
    // Validate role if provided
    if (request.role !== undefined) {
        if (typeof request.role !== 'string') {
            throw new ValidationError('Role must be a string');
        }
        if (!isValidRole(request.role)) {
            throw new ValidationError(`Role must be one of: ${VALID_ROLES.join(', ')}`, { validRoles: VALID_ROLES });
        }
    }
    // Validate password if provided
    if (request.password !== undefined) {
        if (typeof request.password !== 'string') {
            throw new ValidationError('Password must be a string');
        }
        if (!isValidPassword(request.password)) {
            throw new ValidationError('Password must be at least 8 characters long');
        }
    }
}
/**
 * Validate login request
 */
function validateLoginRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new ValidationError('Request body must be an object');
    }
    if (!request.username || typeof request.username !== 'string') {
        throw new ValidationError('Username is required and must be a string');
    }
    if (!request.password || typeof request.password !== 'string') {
        throw new ValidationError('Password is required and must be a string');
    }
}
//# sourceMappingURL=validation.js.map