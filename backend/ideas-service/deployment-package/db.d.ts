/**
 * DynamoDB client wrapper for idea operations
 *
 * Provides CRUD operations for the Ideas table with proper error handling
 * and type safety.
 */
import { Idea } from './types';
/**
 * Custom error class for database operations
 */
export declare class DatabaseError extends Error {
    readonly code: string;
    readonly originalError?: any | undefined;
    constructor(message: string, code: string, originalError?: any | undefined);
}
/**
 * Create a new idea in DynamoDB
 */
export declare function createIdea(idea: Idea): Promise<void>;
/**
 * Get idea by ideaId
 */
export declare function getIdeaById(ideaId: string): Promise<Idea | null>;
/**
 * Get all ideas
 */
export declare function getAllIdeas(): Promise<Idea[]>;
/**
 * Get ideas by submitter using GSI
 */
export declare function getIdeasBySubmitter(submitterId: string): Promise<Idea[]>;
/**
 * Get ideas by assignee using GSI
 */
export declare function getIdeasByAssignee(assigneeId: string): Promise<Idea[]>;
/**
 * Get ideas by status using GSI
 */
export declare function getIdeasByStatus(status: string): Promise<Idea[]>;
/**
 * Update idea fields
 */
export declare function updateIdea(ideaId: string, updates: Partial<Omit<Idea, 'ideaId' | 'createdAt'>>): Promise<void>;
/**
 * Check if a user exists in the Users table
 */
export declare function userExists(userId: string): Promise<boolean>;
/**
 * Delete idea by ID
 * Ensures write completes successfully before returning
 */
export declare function deleteIdea(ideaId: string): Promise<void>;
//# sourceMappingURL=db.d.ts.map