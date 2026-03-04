/**
 * Unit tests for validation utilities
 */

import {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidRole,
  validateCreateUserRequest,
  validateUpdateUserRequest,
  validateLoginRequest,
  ValidationError
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@company.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should accept valid usernames', () => {
      expect(isValidUsername('user')).toBe(true);
      expect(isValidUsername('a'.repeat(50))).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('')).toBe(false);
      expect(isValidUsername('a'.repeat(51))).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept passwords with 8+ characters', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('should accept valid roles', () => {
      expect(isValidRole('Employee')).toBe(true);
      expect(isValidRole('Reviewer')).toBe(true);
      expect(isValidRole('Implementer')).toBe(true);
      expect(isValidRole('Admin')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isValidRole('InvalidRole')).toBe(false);
      expect(isValidRole('employee')).toBe(false);
    });
  });

  describe('validateCreateUserRequest', () => {
    it('should accept valid create user request', () => {
      const request = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'Employee'
      };
      expect(() => validateCreateUserRequest(request)).not.toThrow();
    });

    it('should reject request without username', () => {
      const request = {
        email: 'test@example.com',
        password: 'password123',
        role: 'Employee'
      };
      expect(() => validateCreateUserRequest(request)).toThrow(ValidationError);
    });

    it('should reject request with invalid email', () => {
      const request = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        role: 'Employee'
      };
      expect(() => validateCreateUserRequest(request)).toThrow(ValidationError);
    });

    it('should reject request with short password', () => {
      const request = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
        role: 'Employee'
      };
      expect(() => validateCreateUserRequest(request)).toThrow(ValidationError);
    });

    it('should reject request with invalid role', () => {
      const request = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'InvalidRole'
      };
      expect(() => validateCreateUserRequest(request)).toThrow(ValidationError);
    });
  });

  describe('validateUpdateUserRequest', () => {
    it('should accept valid update request', () => {
      const request = { email: 'new@example.com' };
      expect(() => validateUpdateUserRequest(request)).not.toThrow();
    });

    it('should reject empty update request', () => {
      const request = {};
      expect(() => validateUpdateUserRequest(request)).toThrow(ValidationError);
    });

    it('should reject update with invalid email', () => {
      const request = { email: 'invalid' };
      expect(() => validateUpdateUserRequest(request)).toThrow(ValidationError);
    });
  });

  describe('validateLoginRequest', () => {
    it('should accept valid login request', () => {
      const request = {
        username: 'testuser',
        password: 'password123'
      };
      expect(() => validateLoginRequest(request)).not.toThrow();
    });

    it('should reject request without username', () => {
      const request = { password: 'password123' };
      expect(() => validateLoginRequest(request)).toThrow(ValidationError);
    });

    it('should reject request without password', () => {
      const request = { username: 'testuser' };
      expect(() => validateLoginRequest(request)).toThrow(ValidationError);
    });
  });
});
