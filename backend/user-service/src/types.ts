/**
 * User data model matching DynamoDB schema
 */
export interface User {
  userId: string;           // UUID - Primary key
  username: string;         // Unique username
  email: string;            // User email
  passwordHash: string;     // Bcrypt hashed password
  role: UserRole;           // User role
  createdAt: string;        // ISO 8601 timestamp
  updatedAt: string;        // ISO 8601 timestamp
}

/**
 * Valid user roles in the system
 */
export type UserRole = 'Employee' | 'Reviewer' | 'Implementer' | 'Admin';

/**
 * Session token payload
 */
export interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
}

/**
 * Authentication request
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Authentication response
 */
export interface LoginResponse {
  token: string;
  userId: string;
  role: UserRole;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  password?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
