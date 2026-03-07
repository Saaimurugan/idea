/**
 * Idea data model matching DynamoDB schema
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
/**
 * Valid idea status values
 */
export type IdeaStatus = 'Pending Review' | 'In Review' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';
/**
 * Comment on an idea
 */
export interface Comment {
    commentId: string;
    authorId: string;
    text: string;
    createdAt: string;
}
/**
 * Status change record
 */
export interface StatusChange {
    status: IdeaStatus;
    changedBy: string;
    changedAt: string;
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
//# sourceMappingURL=types.d.ts.map