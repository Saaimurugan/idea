"use strict";
/**
 * Input validation utilities for idea data
 *
 * Provides validation functions for idea-related inputs to ensure data integrity
 * before persistence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.isValidStatus = isValidStatus;
exports.isValidTitle = isValidTitle;
exports.isValidDescription = isValidDescription;
exports.isValidCommentText = isValidCommentText;
exports.validateCreateIdeaRequest = validateCreateIdeaRequest;
exports.validateAssignIdeaRequest = validateAssignIdeaRequest;
exports.validateUpdateStatusRequest = validateUpdateStatusRequest;
exports.validateCreateCommentRequest = validateCreateCommentRequest;
/**
 * Valid idea status values
 */
const VALID_STATUSES = [
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
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Validate idea status
 */
function isValidStatus(status) {
    return VALID_STATUSES.includes(status);
}
/**
 * Validate title format
 */
function isValidTitle(title) {
    return title.length >= 1 && title.length <= 200;
}
/**
 * Validate description format
 */
function isValidDescription(description) {
    return description.length >= 1 && description.length <= 5000;
}
/**
 * Validate comment text format
 */
function isValidCommentText(text) {
    return text.length >= 1 && text.length <= 2000;
}
/**
 * Validate idea creation request
 */
function validateCreateIdeaRequest(request) {
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
function validateAssignIdeaRequest(request) {
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
function validateUpdateStatusRequest(request) {
    if (!request || typeof request !== 'object') {
        throw new ValidationError('Request body must be an object');
    }
    // Validate status
    if (!request.status || typeof request.status !== 'string') {
        throw new ValidationError('Status is required and must be a string');
    }
    if (!isValidStatus(request.status)) {
        throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`, { validStatuses: VALID_STATUSES });
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
function validateCreateCommentRequest(request) {
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
//# sourceMappingURL=validation.js.map