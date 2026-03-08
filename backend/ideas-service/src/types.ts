/**
 * Idea data model matching DynamoDB schema
 */
export interface Idea {
  ideaId: string;              // UUID - Primary key
  title: string;               // Idea title
  description: string;         // Idea description
  submitterId: string;         // References User.userId
  assigneeId?: string;         // References User.userId (optional)
  status: IdeaStatus;          // Current status
  rejectionReason?: string;    // Required when status is Rejected
  comments: Comment[];         // Array of comments
  statusHistory: StatusChange[]; // History of status changes
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
}

/**
 * Valid user roles in the system
 */
export type UserRole = 'Employee' | 'Reviewer' | 'Implementer' | 'Admin';

/**
 * Valid idea status values
 */
export type IdeaStatus = 
  | 'Pending Review'
  | 'In Review'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';

/**
 * Comment on an idea
 */
export interface Comment {
  commentId: string;           // UUID
  authorId: string;            // References User.userId
  text: string;                // Comment text
  createdAt: string;           // ISO 8601 timestamp
}

/**
 * Status change record
 */
export interface StatusChange {
  status: IdeaStatus;          // New status
  changedBy: string;           // References User.userId
  changedAt: string;           // ISO 8601 timestamp
}

/**
 * Idea submission request
 */
export interface CreateIdeaRequest {
  title: string;
  description: string;
  submitterId: string;
}

/**
 * Idea assignment request
 */
export interface AssignIdeaRequest {
  assigneeId: string;
  reviewerId: string;
}

/**
 * Status update request
 */
export interface UpdateStatusRequest {
  status: IdeaStatus;
  userId: string;
  role: string;
  reason?: string;
}

/**
 * Comment creation request
 */
export interface CreateCommentRequest {
  userId: string;
  text: string;
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
