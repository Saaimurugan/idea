/**
 * Input validation utilities for user data
 * 
 * Provides validation functions for user-related inputs to ensure data integrity
 * before persistence.
 */

import { UserRole, CreateUserRequest, UpdateUserRequest } from './types';

/**
 * Valid user roles
 */
const VALID_ROLES: UserRole[] = ['Employee', 'Reviewer', 'Implementer', 'Admin'];

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return username.length >= 1 && username.length <= 50;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validate user role
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Validate user creation request
 */
export function validateCreateUserRequest(request: any): asserts request is CreateUserRequest {
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
    throw new ValidationError(
      `Role must be one of: ${VALID_ROLES.join(', ')}`,
      { validRoles: VALID_ROLES }
    );
  }
}

/**
 * Validate user update request
 */
export function validateUpdateUserRequest(request: any): asserts request is UpdateUserRequest {
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
      throw new ValidationError(
        `Role must be one of: ${VALID_ROLES.join(', ')}`,
        { validRoles: VALID_ROLES }
      );
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
export function validateLoginRequest(request: any): void {
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
