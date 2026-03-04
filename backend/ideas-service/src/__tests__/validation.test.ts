/**
 * Unit tests for idea validation utilities
 */

import {
  ValidationError,
  isValidStatus,
  isValidTitle,
  isValidDescription,
  isValidCommentText,
  validateCreateIdeaRequest,
  validateAssignIdeaRequest,
  validateUpdateStatusRequest,
  validateCreateCommentRequest
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidStatus', () => {
    it('should accept valid status values', () => {
      expect(isValidStatus('Pending Review')).toBe(true);
      expect(isValidStatus('In Review')).toBe(true);
      expect(isValidStatus('Assigned')).toBe(true);
      expect(isValidStatus('In Progress')).toBe(true);
      expect(isValidStatus('Completed')).toBe(true);
      expect(isValidStatus('Rejected')).toBe(true);
    });

    it('should reject invalid status values', () => {
      expect(isValidStatus('Invalid')).toBe(false);
      expect(isValidStatus('pending')).toBe(false);
      expect(isValidStatus('')).toBe(false);
    });
  });

  describe('isValidTitle', () => {
    it('should accept valid titles', () => {
      expect(isValidTitle('A')).toBe(true);
      expect(isValidTitle('Valid Title')).toBe(true);
      expect(isValidTitle('A'.repeat(200))).toBe(true);
    });

    it('should reject invalid titles', () => {
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle('A'.repeat(201))).toBe(false);
    });
  });

  describe('isValidDescription', () => {
    it('should accept valid descriptions', () => {
      expect(isValidDescription('A')).toBe(true);
      expect(isValidDescription('Valid description')).toBe(true);
      expect(isValidDescription('A'.repeat(5000))).toBe(true);
    });

    it('should reject invalid descriptions', () => {
      expect(isValidDescription('')).toBe(false);
      expect(isValidDescription('A'.repeat(5001))).toBe(false);
    });
  });

  describe('isValidCommentText', () => {
    it('should accept valid comment text', () => {
      expect(isValidCommentText('A')).toBe(true);
      expect(isValidCommentText('Valid comment')).toBe(true);
      expect(isValidCommentText('A'.repeat(2000))).toBe(true);
    });

    it('should reject invalid comment text', () => {
      expect(isValidCommentText('')).toBe(false);
      expect(isValidCommentText('A'.repeat(2001))).toBe(false);
    });
  });

  describe('validateCreateIdeaRequest', () => {
    it('should accept valid idea creation request', () => {
      const request = {
        title: 'Test Idea',
        description: 'Test description',
        submitterId: 'user-123'
      };
      expect(() => validateCreateIdeaRequest(request)).not.toThrow();
    });

    it('should reject request without title', () => {
      const request = {
        description: 'Test description',
        submitterId: 'user-123'
      };
      expect(() => validateCreateIdeaRequest(request)).toThrow(ValidationError);
      expect(() => validateCreateIdeaRequest(request)).toThrow('Title is required');
    });

    it('should reject request without description', () => {
      const request = {
        title: 'Test Idea',
        submitterId: 'user-123'
      };
      expect(() => validateCreateIdeaRequest(request)).toThrow(ValidationError);
      expect(() => validateCreateIdeaRequest(request)).toThrow('Description is required');
    });

    it('should reject request without submitterId', () => {
      const request = {
        title: 'Test Idea',
        description: 'Test description'
      };
      expect(() => validateCreateIdeaRequest(request)).toThrow(ValidationError);
      expect(() => validateCreateIdeaRequest(request)).toThrow('Submitter ID is required');
    });

    it('should reject request with invalid title length', () => {
      const request = {
        title: '',
        description: 'Test description',
        submitterId: 'user-123'
      };
      expect(() => validateCreateIdeaRequest(request)).toThrow(ValidationError);
    });
  });

  describe('validateAssignIdeaRequest', () => {
    it('should accept valid assignment request', () => {
      const request = {
        assigneeId: 'user-123',
        reviewerId: 'reviewer-456'
      };
      expect(() => validateAssignIdeaRequest(request)).not.toThrow();
    });

    it('should reject request without assigneeId', () => {
      const request = {
        reviewerId: 'reviewer-456'
      };
      expect(() => validateAssignIdeaRequest(request)).toThrow(ValidationError);
      expect(() => validateAssignIdeaRequest(request)).toThrow('Assignee ID is required');
    });

    it('should reject request without reviewerId', () => {
      const request = {
        assigneeId: 'user-123'
      };
      expect(() => validateAssignIdeaRequest(request)).toThrow(ValidationError);
      expect(() => validateAssignIdeaRequest(request)).toThrow('Reviewer ID is required');
    });
  });

  describe('validateUpdateStatusRequest', () => {
    it('should accept valid status update request', () => {
      const request = {
        status: 'In Progress',
        userId: 'user-123',
        role: 'Implementer'
      };
      expect(() => validateUpdateStatusRequest(request)).not.toThrow();
    });

    it('should accept rejection with reason', () => {
      const request = {
        status: 'Rejected',
        userId: 'user-123',
        role: 'Reviewer',
        reason: 'Not feasible'
      };
      expect(() => validateUpdateStatusRequest(request)).not.toThrow();
    });

    it('should reject request without status', () => {
      const request = {
        userId: 'user-123',
        role: 'Implementer'
      };
      expect(() => validateUpdateStatusRequest(request)).toThrow(ValidationError);
      expect(() => validateUpdateStatusRequest(request)).toThrow('Status is required');
    });

    it('should reject request with invalid status', () => {
      const request = {
        status: 'Invalid Status',
        userId: 'user-123',
        role: 'Implementer'
      };
      expect(() => validateUpdateStatusRequest(request)).toThrow(ValidationError);
      expect(() => validateUpdateStatusRequest(request)).toThrow('Status must be one of');
    });

    it('should reject rejection without reason', () => {
      const request = {
        status: 'Rejected',
        userId: 'user-123',
        role: 'Reviewer'
      };
      expect(() => validateUpdateStatusRequest(request)).toThrow(ValidationError);
      expect(() => validateUpdateStatusRequest(request)).toThrow('Rejection reason is required');
    });

    it('should reject rejection with empty reason', () => {
      const request = {
        status: 'Rejected',
        userId: 'user-123',
        role: 'Reviewer',
        reason: '   '
      };
      expect(() => validateUpdateStatusRequest(request)).toThrow(ValidationError);
      expect(() => validateUpdateStatusRequest(request)).toThrow('Rejection reason cannot be empty');
    });
  });

  describe('validateCreateCommentRequest', () => {
    it('should accept valid comment creation request', () => {
      const request = {
        userId: 'user-123',
        text: 'This is a comment'
      };
      expect(() => validateCreateCommentRequest(request)).not.toThrow();
    });

    it('should reject request without userId', () => {
      const request = {
        text: 'This is a comment'
      };
      expect(() => validateCreateCommentRequest(request)).toThrow(ValidationError);
      expect(() => validateCreateCommentRequest(request)).toThrow('User ID is required');
    });

    it('should reject request without text', () => {
      const request = {
        userId: 'user-123'
      };
      expect(() => validateCreateCommentRequest(request)).toThrow(ValidationError);
      expect(() => validateCreateCommentRequest(request)).toThrow('Comment text is required');
    });

    it('should reject request with invalid text length', () => {
      const request = {
        userId: 'user-123',
        text: ''
      };
      expect(() => validateCreateCommentRequest(request)).toThrow(ValidationError);
    });
  });
});
