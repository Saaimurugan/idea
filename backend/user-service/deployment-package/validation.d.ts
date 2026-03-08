/**
 * Input validation utilities for user data
 *
 * Provides validation functions for user-related inputs to ensure data integrity
 * before persistence.
 */
import { UserRole, CreateUserRequest, UpdateUserRequest } from './types';
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    details?: any | undefined;
    constructor(message: string, details?: any | undefined);
}
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate username format
 */
export declare function isValidUsername(username: string): boolean;
/**
 * Validate password strength
 */
export declare function isValidPassword(password: string): boolean;
/**
 * Validate user role
 */
export declare function isValidRole(role: string): role is UserRole;
/**
 * Validate user creation request
 */
export declare function validateCreateUserRequest(request: any): asserts request is CreateUserRequest;
/**
 * Validate user update request
 */
export declare function validateUpdateUserRequest(request: any): asserts request is UpdateUserRequest;
/**
 * Validate login request
 */
export declare function validateLoginRequest(request: any): void;
//# sourceMappingURL=validation.d.ts.map