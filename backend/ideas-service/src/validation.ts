/**
 * Input validation utilities for idea data
 * 
 * Provides validation functions for idea-related inputs to ensure data integrity
 * before persistence.
 */

import {
  IdeaStatus,
  CreateIdeaRequest,
  AssignIdeaRequest,
  UpdateStatusRequest,
  CreateCommentRequest
} from './types';

/**
 * Valid idea status values
 */
const VALID_STATUSES: IdeaStatus[] = [
  'Pending Review',
  'In Review',
  'Assigned',
  'In Progress',
  'Completed',
  'Rejected'
];

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
 * Validate idea status
 */
export function isValidStatus(status: string): status is IdeaStatus {
  return VALID_STATUSES.includes(status as IdeaStatus);
}

/**
 * Validate title format
 */
export function isValidTitle(title: string): boolean {
  return title.length >= 1 && title.length <= 200;
}

/**
 * Validate description format
 */
export function isValidDescription(description: string): boolean {
  return description.length >= 1 && description.length <= 5000;
}

/**
 * Validate comment text format
 */
export function isValidCommentText(text: string): boolean {
  return text.length >= 1 && text.length <= 2000;
}

/**
 * Validate idea creation request
 */
export function validateCreateIdeaRequest(request: any): asserts request is CreateIdeaRequest {
  if (!request || typeof request !== 'object') {
    throw new ValidationError('Request body must be an object');
  }
  
  // Validate title
  if (!request.title || typeof request.title !== 'string') {
    throw new ValidationError('Title is required and must be a string');
  }
  if (!isValidTitle(request.title)) {
    throw new ValidationError('Title must be between 1 and 200 characters');
  }
  
  // Validate description
  if (!request.description || typeof request.description !== 'string') {
    throw new ValidationError('Description is required and must be a string');
  }
  if (!isValidDescription(request.description)) {
    throw new ValidationError('Description must be between 1 and 5000 characters');
  }
  
  // Validate submitterId
  if (!request.submitterId || typeof request.submitterId !== 'string') {
    throw new ValidationError('Submitter ID is required and must be a string');
  }
}

/**
 * Validate idea assignment request
 */
export function validateAssignIdeaRequest(request: any): asserts request is AssignIdeaRequest {
  if (!request || typeof request !== 'object') {
    throw new ValidationError('Request body must be an object');
  }
  
  // Validate assigneeId
  if (!request.assigneeId || typeof request.assigneeId !== 'string') {
    throw new ValidationError('Assignee ID is required and must be a string');
  }
  
  // Validate reviewerId
  if (!request.reviewerId || typeof request.reviewerId !== 'string') {
    throw new ValidationError('Reviewer ID is required and must be a string');
  }
}

/**
 * Validate status update request
 */
export function validateUpdateStatusRequest(request: any): asserts request is UpdateStatusRequest {
  if (!request || typeof request !== 'object') {
    throw new ValidationError('Request body must be an object');
  }
  
  // Validate status
  if (!request.status || typeof request.status !== 'string') {
    throw new ValidationError('Status is required and must be a string');
  }
  if (!isValidStatus(request.status)) {
    throw new ValidationError(
      `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      { validStatuses: VALID_STATUSES }
    );
  }
  
  // Validate userId
  if (!request.userId || typeof request.userId !== 'string') {
    throw new ValidationError('User ID is required and must be a string');
  }
  
  // Validate role
  if (!request.role || typeof request.role !== 'string') {
    throw new ValidationError('Role is required and must be a string');
  }
  
  // Validate rejection reason if status is Rejected
  if (request.status === 'Rejected') {
    if (!request.reason || typeof request.reason !== 'string') {
      throw new ValidationError('Rejection reason is required when rejecting an idea');
    }
    if (request.reason.trim().length === 0) {
      throw new ValidationError('Rejection reason cannot be empty');
    }
  }
}

/**
 * Validate comment creation request
 */
export function validateCreateCommentRequest(request: any): asserts request is CreateCommentRequest {
  if (!request || typeof request !== 'object') {
    throw new ValidationError('Request body must be an object');
  }
  
  // Validate userId
  if (!request.userId || typeof request.userId !== 'string') {
    throw new ValidationError('User ID is required and must be a string');
  }
  
  // Validate text
  if (!request.text || typeof request.text !== 'string') {
    throw new ValidationError('Comment text is required and must be a string');
  }
  if (!isValidCommentText(request.text)) {
    throw new ValidationError('Comment text must be between 1 and 2000 characters');
  }
}

/**
 * Validate idea update request
 */
export function validateUpdateIdeaRequest(request: any): void {
  if (!request || typeof request !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  // At least one field must be provided
  if (!request.title && !request.description) {
    throw new ValidationError('At least one field (title or description) must be provided');
  }

  // Validate title if provided
  if (request.title !== undefined) {
    if (typeof request.title !== 'string') {
      throw new ValidationError('Title must be a string');
    }
    if (request.title.trim().length === 0) {
      throw new ValidationError('Title cannot be empty');
    }
    if (request.title.length > 200) {
      throw new ValidationError('Title must not exceed 200 characters');
    }
  }

  // Validate description if provided
  if (request.description !== undefined) {
    if (typeof request.description !== 'string') {
      throw new ValidationError('Description must be a string');
    }
    if (request.description.trim().length === 0) {
      throw new ValidationError('Description cannot be empty');
    }
    if (request.description.length > 2000) {
      throw new ValidationError('Description must not exceed 2000 characters');
    }
  }
}
