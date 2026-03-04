# User Service

Lambda function that handles all user CRUD operations and authentication.

## Responsibilities

- User authentication with username/password
- User creation, retrieval, update, and deletion
- Role management
- Session token generation and validation
- Role-based access control enforcement

## API Endpoints

### Authentication

**POST /auth/login**
- Authenticate user with username and password
- Returns session token, userId, and role
- Public endpoint

### User Management

**POST /users**
- Create new user (Admin only)
- Validates username uniqueness
- Hashes password before storage

**GET /users**
- List all users (Admin only)
- Supports role filtering (Reviewer can filter by role)

**GET /users/{userId}**
- Get user by ID
- Returns user details (without password hash)

**PUT /users/{userId}**
- Update user email, role, or password (Admin only)
- Validates role values

**DELETE /users/{userId}**
- Delete user (Admin only)

## Environment Variables

- `USERS_TABLE_NAME`: Name of the Users DynamoDB table
- `ENVIRONMENT`: Current environment (dev/staging/prod)

## Data Model

See `src/types.ts` for complete type definitions.

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
