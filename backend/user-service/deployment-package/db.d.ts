/**
 * DynamoDB client wrapper for user operations
 *
 * Provides CRUD operations for the Users table with proper error handling
 * and type safety.
 */
import { User } from './types';
/**
 * Create a new user in DynamoDB
 * Ensures write completes successfully and enforces userId uniqueness
 * Note: Username uniqueness must be checked by caller using getUserByUsername before calling this
 */
export declare function createUser(user: User): Promise<void>;
/**
 * Get user by userId
 */
export declare function getUserById(userId: string): Promise<User | null>;
/**
 * Get user by username using GSI
 */
export declare function getUserByUsername(username: string): Promise<User | null>;
/**
 * Get all users
 */
export declare function getAllUsers(): Promise<User[]>;
/**
 * Get users by role using GSI
 */
export declare function getUsersByRole(role: string): Promise<User[]>;
/**
 * Update user fields
 * Ensures write completes successfully before returning
 */
export declare function updateUser(userId: string, updates: Partial<Omit<User, 'userId' | 'createdAt'>>): Promise<void>;
/**
 * Delete user by userId
 * Ensures write completes successfully before returning
 */
export declare function deleteUser(userId: string): Promise<void>;
//# sourceMappingURL=db.d.ts.map