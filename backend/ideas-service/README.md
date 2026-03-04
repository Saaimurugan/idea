# Ideas Service

Lambda function that handles all idea CRUD operations, assignments, and comments.

## Responsibilities

- Idea submission and validation
- Idea retrieval with role-based filtering
- Idea assignment to implementers
- Status management through the idea lifecycle
- Comment management
- Referential integrity checks with Users table

## API Endpoints

### Idea Operations

**POST /ideas**
- Submit new idea
- Validates title and description
- Sets initial status to "Pending Review"

**GET /ideas**
- List ideas with role-based filtering:
  - Employee: Own submissions
  - Reviewer: Pending review or in review
  - Implementer: Assigned ideas
  - Admin: All ideas

**GET /ideas/{ideaId}**
- Get idea by ID with full details

### Assignment and Status

**PUT /ideas/{ideaId}/assign**
- Assign idea to implementer (Reviewer/Admin only)
- Validates assignee exists
- Updates status to "Assigned"

**PUT /ideas/{ideaId}/status**
- Update idea status
- Validates status transitions
- Requires rejection reason for "Rejected" status
- Records status change in history

### Comments

**POST /ideas/{ideaId}/comments**
- Add comment to idea
- Implementer: Assigned ideas only
- Reviewer/Admin: Any idea

**GET /ideas/{ideaId}/comments**
- Get all comments for an idea
- Returns in chronological order

## Environment Variables

- `IDEAS_TABLE_NAME`: Name of the Ideas DynamoDB table
- `USERS_TABLE_NAME`: Name of the Users DynamoDB table
- `ENVIRONMENT`: Current environment (dev/staging/prod)

## Data Model

See `src/types.ts` for complete type definitions.

## Valid Status Values

- Pending Review
- In Review
- Assigned
- In Progress
- Completed
- Rejected

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Build

```bash
npm run build
```

Output will be in the `dist/` directory.
