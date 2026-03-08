/**
 * Input validation utilities for idea data
 *
 * Provides validation functions for idea-related inputs to ensure data integrity
 * before persistence.
 */
import { IdeaStatus, CreateIdeaRequest, AssignIdeaRequest, UpdateStatusRequest, CreateCommentRequest } from './types';
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    details?: any | undefined;
    constructor(message: string, details?: any | undefined);
}
/**
 * Validate idea status
 */
export declare function isValidStatus(status: string): status is IdeaStatus;
/**
 * Validate title format
 */
export declare function isValidTitle(title: string): boolean;
/**
 * Validate description format
 */
export declare function isValidDescription(description: string): boolean;
/**
 * Validate comment text format
 */
export declare function isValidCommentText(text: string): boolean;
/**
 * Validate idea creation request
 */
export declare function validateCreateIdeaRequest(request: any): asserts request is CreateIdeaRequest;
/**
 * Validate idea assignment request
 */
export declare function validateAssignIdeaRequest(request: any): asserts request is AssignIdeaRequest;
/**
 * Validate status update request
 */
export declare function validateUpdateStatusRequest(request: any): asserts request is UpdateStatusRequest;
/**
 * Validate comment creation request
 */
export declare function validateCreateCommentRequest(request: any): asserts request is CreateCommentRequest;
/**
 * Validate idea update request
 */
export declare function validateUpdateIdeaRequest(request: any): void;
//# sourceMappingURL=validation.d.ts.map