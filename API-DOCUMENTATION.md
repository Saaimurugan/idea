# API Documentation

## Base URL
```
https://5ctqosryp2.execute-api.us-east-2.amazonaws.com/prod
```

## Authentication
All endpoints (except `/auth/login`) require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## User Service Endpoints

### Authentication

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "role": "Employee"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request body
- `401`: Invalid credentials
- `500`: Internal server error

### User Management

#### POST /users
Create new user (Admin only).

**Request Body:**
```json
{
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "role": "Reviewer"
}
```

**Response:**
```json
{
  "userId": "456e7890-f12c-34d5-b678-567825175111",
  "username": "janedoe",
  "email": "jane@example.com",
  "role": "Reviewer",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201`: User created
- `400`: Validation error
- `409`: Username already exists
- `403`: Insufficient permissions

#### GET /users
List users (Admin/Reviewer only).

**Query Parameters:**
- `role` (optional): Filter by role
- `limit` (optional): Number of results (default: 50, max: 100)
- `nextToken` (optional): Pagination token

**Response:**
```json
{
  "users": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "Employee",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextToken": "eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCJ9"
}
```

**Status Codes:**
- `200`: Success
- `403`: Insufficient permissions

#### GET /users/{userId}
Get user by ID.

**Path Parameters:**
- `userId`: User ID (UUID)

**Response:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "Employee",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `404`: User not found

#### PUT /users/{userId}
Update user (Admin only).

**Path Parameters:**
- `userId`: User ID (UUID)

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "role": "Implementer",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "username": "johndoe",
  "email": "newemail@example.com",
  "role": "Implementer",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `403`: Insufficient permissions
- `404`: User not found

#### DELETE /users/{userId}
Delete user (Admin only).

**Path Parameters:**
- `userId`: User ID (UUID)

**Response:**
- `204`: No content (success)

**Status Codes:**
- `204`: Success
- `403`: Insufficient permissions
- `404`: User not found

## Ideas Service Endpoints

### Idea Operations

#### POST /ideas
Submit new idea.

**Request Body:**
```json
{
  "title": "Implement Single Sign-On",
  "description": "Add SSO support using OAuth 2.0 to improve security and user experience",
  "submitterId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "ideaId": "789f0123-g45d-67e8-h901-678936176222",
  "title": "Implement Single Sign-On",
  "description": "Add SSO support using OAuth 2.0 to improve security and user experience",
  "submitterId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Pending Review",
  "comments": [],
  "statusHistory": [
    {
      "status": "Pending Review",
      "changedBy": "123e4567-e89b-12d3-a456-426614174000",
      "changedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `201`: Idea created
- `400`: Validation error
- `404`: Submitter not found

#### GET /ideas
List ideas with role-based filtering.

**Query Parameters:**
- `status` (optional): Filter by status
- `submitterId` (optional): Filter by submitter (Employee only)
- `assigneeId` (optional): Filter by assignee (Implementer only)
- `limit` (optional): Number of results (default: 50, max: 100)
- `nextToken` (optional): Pagination token

**Role-Based Access:**
- **Employee**: Own submissions only
- **Reviewer**: Pending review and in review ideas
- **Implementer**: Assigned ideas only
- **Admin**: All ideas

**Response:**
```json
{
  "ideas": [
    {
      "ideaId": "789f0123-g45d-67e8-h901-678936176222",
      "title": "Implement Single Sign-On",
      "description": "Add SSO support using OAuth 2.0...",
      "submitterId": "123e4567-e89b-12d3-a456-426614174000",
      "status": "Pending Review",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextToken": "eyJpZCI6Ijc4OWYwMTIzLWc0NWQtNjdlOC1oOTAxLTY3ODkzNjE3NjIyMiJ9"
}
```

**Status Codes:**
- `200`: Success
- `403`: Insufficient permissions

#### GET /ideas/{ideaId}
Get idea by ID with full details.

**Path Parameters:**
- `ideaId`: Idea ID (UUID)

**Response:**
```json
{
  "ideaId": "789f0123-g45d-67e8-h901-678936176222",
  "title": "Implement Single Sign-On",
  "description": "Add SSO support using OAuth 2.0 to improve security and user experience",
  "submitterId": "123e4567-e89b-12d3-a456-426614174000",
  "assigneeId": "456e7890-f12c-34d5-b678-567825175111",
  "status": "In Progress",
  "rejectionReason": null,
  "comments": [
    {
      "commentId": "abc12345-6789-0def-ghij-123456789012",
      "authorId": "123e4567-e89b-12d3-a456-426614174000",
      "text": "Have you considered using Azure AD instead of Okta?",
      "createdAt": "2024-01-16T14:20:00Z"
    }
  ],
  "statusHistory": [
    {
      "status": "Pending Review",
      "changedBy": "123e4567-e89b-12d3-a456-426614174000",
      "changedAt": "2024-01-15T10:30:00Z"
    },
    {
      "status": "In Review",
      "changedBy": "456e7890-f12c-34d5-b678-567825175111",
      "changedAt": "2024-01-16T09:15:00Z"
    },
    {
      "status": "In Progress",
      "changedBy": "456e7890-f12c-34d5-b678-567825175111",
      "changedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Status Codes:**
- `200`: Success
- `403`: Insufficient permissions
- `404`: Idea not found

### Assignment and Status

#### PUT /ideas/{ideaId}/assign
Assign idea to implementer (Reviewer/Admin only).

**Path Parameters:**
- `ideaId`: Idea ID (UUID)

**Request Body:**
```json
{
  "assigneeId": "456e7890-f12c-34d5-b678-567825175111",
  "reviewerId": "789f0123-g45d-67e8-h901-678936176222"
}
```

**Response:**
```json
{
  "ideaId": "789f0123-g45d-67e8-h901-678936176222",
  "assigneeId": "456e7890-f12c-34d5-b678-567825175111",
  "status": "Assigned",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `403`: Insufficient permissions
- `404`: Idea or assignee not found

#### PUT /ideas/{ideaId}/status
Update idea status.

**Path Parameters:**
- `ideaId`: Idea ID (UUID)

**Request Body:**
```json
{
  "status": "In Progress",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "role": "Implementer",
  "reason": "Starting implementation phase"
}
```

**Note:** `reason` is required when status is "Rejected".

**Response:**
```json
{
  "ideaId": "789f0123-g45d-67e8-h901-678936176222",
  "status": "In Progress",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `403`: Insufficient permissions
- `404`: Idea not found

### Comments

#### POST /ideas/{ideaId}/comments
Add comment to idea.

**Path Parameters:**
- `ideaId`: Idea ID (UUID)

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "text": "Have you considered using Azure AD instead of Okta?"
}
```

**Response:**
```json
{
  "commentId": "abc12345-6789-0def-ghij-123456789012",
  "authorId": "123e4567-e89b-12d3-a456-426614174000",
  "text": "Have you considered using Azure AD instead of Okta?",
  "createdAt": "2024-01-16T14:20:00Z"
}
```

**Status Codes:**
- `201`: Comment created
- `400`: Validation error
- `403`: Insufficient permissions
- `404`: Idea not found

#### GET /ideas/{ideaId}/comments
Get all comments for an idea.

**Path Parameters:**
- `ideaId`: Idea ID (UUID)

**Response:**
```json
{
  "comments": [
    {
      "commentId": "abc12345-6789-0def-ghij-123456789012",
      "authorId": "123e4567-e89b-12d3-a456-426614174000",
      "text": "Have you considered using Azure AD instead of Okta?",
      "createdAt": "2024-01-16T14:20:00Z"
    },
    {
      "commentId": "def67890-1234-5ghi-jklm-234567890123",
      "authorId": "456e7890-f12c-34d5-b678-567825175111",
      "text": "Good suggestion, I'll look into Azure AD options.",
      "createdAt": "2024-01-17T09:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `403`: Insufficient permissions
- `404`: Idea not found

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "issue": "Specific issue description"
    }
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `AUTH_ERROR` | Authentication failure | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `INTERNAL_ERROR` | Server-side error | 500 |

### Validation Error Examples

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "field": "password",
      "issue": "Password is required"
    }
  }
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Burst Limit**: 10 requests per second
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per minute
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## CORS Configuration

- **Allowed Origins**: Frontend domain only
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Max Age**: 86400 seconds (24 hours)

## Data Types

### UserRole
```typescript
type UserRole = 'Employee' | 'Reviewer' | 'Implementer' | 'Admin';
```

### IdeaStatus
```typescript
type IdeaStatus = 
  | 'Pending Review'
  | 'In Review'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';
```

### Timestamps
All timestamps are in ISO 8601 format:
```typescript
"2024-01-15T10:30:00Z"
```

### UUID Format
All IDs are UUID v4 format:
```typescript
"123e4567-e89b-12d3-a456-426614174000"
```

## Testing the API

### Using cURL
```bash
# Login
curl -X POST https://5ctqosryp2.execute-api.us-east-2.amazonaws.com/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get ideas (with token)
curl -X GET https://5ctqosryp2.execute-api.us-east-2.amazonaws.com/prod/ideas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import the collection from `docs/postman-collection.json`
2. Set environment variables:
   - `baseUrl`: API base URL
   - `token`: JWT token from login
3. Run requests from the collection

## Versioning

- **Current Version**: v1
- **Version Header**: `X-API-Version: 1`
- **Deprecation Policy**: Endpoints deprecated for 6 months before removal

## Changelog

### v1.0.0 (Current)
- Initial API release
- User authentication and management
- Idea submission and management
- Comments and status tracking

## Support

For API issues or questions:
1. Check this documentation
2. Review error responses
3. Contact support@example.com
4. Include request ID from response headers

---

*Last Updated: March 12, 2026*
*API Version: 1.0.0*