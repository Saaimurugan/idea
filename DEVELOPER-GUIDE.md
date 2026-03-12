# Developer Guide

## Table of Contents
1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing Strategy](#testing-strategy)
5. [Deployment Process](#deployment-process)
6. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Git for version control
- AWS account with necessary permissions

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd employee-ideas-management

# Install dependencies
npm run install:all

# Configure AWS credentials
aws configure --profile employee-ideas
```

### Environment Setup
Create a `.env` file in the project root:
```env
NODE_ENV=development
AWS_REGION=us-east-2
AWS_PROFILE=employee-ideas
```

## Project Structure

### Backend Structure
```
backend/
├── user-service/
│   ├── src/
│   │   ├── auth.ts          # Authentication logic
│   │   ├── db.ts           # Database operations
│   │   ├── index.ts        # Lambda handler
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── validation.ts    # Input validation
│   ├── __tests__/          # Unit tests
│   ├── package.json
│   └── tsconfig.json
├── ideas-service/
│   └── (similar structure)
└── shared/                  # Shared utilities
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/                 # API client and services
│   ├── components/          # React components
│   ├── context/             # React context providers
│   ├── routes/              # Application routes
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── public/                  # Static assets
└── package.json
```

## Development Workflow

### 1. Local Development
```bash
# Start frontend development server
cd frontend
npm run dev

# In another terminal, start backend services
cd backend/user-service
npm run dev
```

### 2. Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=user-service

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### 3. Code Quality
```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## Development Guidelines

### 1. Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/feature-name
```

### 3. Testing Strategy
```typescript
// Example test structure
describe('User Service', () => {
  it('should authenticate user', async () => {
    // Arrange
    const credentials = { username: 'test', password: 'password' };
    
    // Act
    const result = await authenticate(credentials);
    
    // Assert
    expect(result).toHaveProperty('token');
  });
});
```

## Backend Development

### Lambda Functions
Each Lambda function should:
1. Validate input
2. Handle errors gracefully
3. Return appropriate HTTP status codes
4. Log important events

Example Lambda handler:
```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Input validation
    const data = validateInput(event.body);
    
    // Business logic
    const result = await processData(data);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### Database Operations
```typescript
// Example DynamoDB operation
const getItem = async (id: string) => {
  const params = {
    TableName: process.env.TABLE_NAME!,
    Key: { id }
  };
  
  const result = await dynamoDB.get(params).promise();
  return result.Item;
};
```

## Frontend Development

### Component Structure
```typescript
// Example React component
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { data, loading, error } = useUserData(user.id);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      {/* Component JSX */}
    </div>
  );
};
```

### API Integration
```typescript
// API client configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Interceptor for adding auth token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Testing Strategy

### Unit Tests
```typescript
// Example test
describe('UserService', () => {
  it('should create user successfully', async () => {
    const user = await createUser(testUser);
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testUser.email);
  });
});
```

### Integration Tests
```typescript
describe('User Authentication', () => {
  it('should authenticate user and return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Deployment

### Local Deployment
```bash
# Build all services
npm run build:all

# Deploy infrastructure
npm run deploy:infrastructure

# Deploy backend
npm run deploy:backend

# Deploy frontend
npm run deploy:frontend
```

### Environment Variables
Create a `.env` file with:
```env
AWS_REGION=us-east-2
ENVIRONMENT=development
USERS_TABLE=users-table
IDEAS_TABLE=ideas-table
```

## Troubleshooting

### Common Issues

1. **Dependency Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

2. **AWS Permissions**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Lambda function locally
aws lambda invoke --function-name my-function response.json
```

3. **Database Connection**
```typescript
// Check DynamoDB connection
const testConnection = async () => {
  try {
    await dynamoDB.listTables().promise();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

## Performance Optimization

### Backend Optimization
- Implement connection pooling
- Use DynamoDB batch operations
- Implement caching with Redis (if needed)
- Optimize Lambda memory and timeout settings

### Frontend Optimization
- Code splitting with React.lazy()
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Implement proper error boundaries

## Security Best Practices

### Backend Security
1. Input validation and sanitization
2. JWT token validation
3. CORS configuration
4. Rate limiting
5. SQL injection prevention

### Frontend Security
1. XSS protection
2. Secure cookie handling
3. Content Security Policy
4. HTTPS enforcement

## Monitoring and Logging

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/function-name --follow

# Set up CloudWatch Alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Additional Resources

### Documentation
- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools and Extensions
- AWS CLI v2
- AWS SAM CLI for local testing
- Postman for API testing
- Chrome DevTools for debugging

### Support Channels
- GitHub Issues for bug reports
- Slack channel for team communication
- Regular team sync meetings

---

*This guide is a living document. Please contribute improvements and updates as the project evolves.*