/**
 * User type matching backend User model
 */
export interface User {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'Employee' | 'Reviewer' | 'Implementer' | 'Admin';

/**
 * Idea type matching backend Idea model
 */
export interface Idea {
  ideaId: string;
  title: string;
  description: string;
  submitterId: string;
  assigneeId?: string;
  status: IdeaStatus;
  rejectionReason?: string;
  comments: Comment[];
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = 
  | 'Pending Review'
  | 'In Review'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';

export interface Comment {
  commentId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface StatusChange {
  status: IdeaStatus;
  changedBy: string;
  changedAt: string;
}

/**
 * Authentication types
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  role: UserRole;
}

/**
 * API Error response
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
