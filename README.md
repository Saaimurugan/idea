# Employee Ideas Management System

A complete serverless web application for managing employee ideas from submission through implementation, built with React, AWS Lambda, DynamoDB, and API Gateway.

## Features

- **Role-Based Access Control**: Employee, Reviewer, Implementer, and Admin roles
- **Idea Lifecycle Management**: Submit, review, assign, implement, and track ideas
- **Real-Time Comments**: Collaborate on ideas with threaded comments
- **Status Tracking**: Monitor idea progress through the implementation pipeline
- **User Management**: Admin dashboard for managing users and permissions

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: AWS Lambda (Node.js 20)
- **Database**: DynamoDB with GSIs
- **API**: API Gateway with CORS
- **Hosting**: S3 static website hosting
- **Region**: us-east-2 (Ohio)

## Quick Start

### Prerequisites

- AWS Account
- AWS CLI installed
- Node.js 18+
- Git Bash (Windows) or Terminal (Mac/Linux)

### Deploy in 5 Minutes

1. **Configure AWS credentials**:
   ```bash
   # Linux/Mac/Git Bash
   ./scripts/setup-aws-profile.sh
   
   # Windows CMD
   scripts\setup-aws-profile.bat
   ```

2. **Deploy everything**:
   ```bash
   ./scripts/deploy-all.sh
   ```

3. **Create admin user**:
   ```bash
   ./scripts/create-admin-user.sh
   ```

4. **Access your application** using the Website URL from the deployment output

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## Documentation

### Complete Documentation Suite
- [Project Overview](PROJECT-OVERVIEW.md) - High-level project introduction and architecture
- [User Guide](USER-GUIDE.md) - Complete user manual for all roles
- [Developer Guide](DEVELOPER-GUIDE.md) - Development setup and instructions
- [API Documentation](API-DOCUMENTATION.md) - Complete API reference
- [Documentation Summary](DOCUMENTATION-SUMMARY.md) - Quick reference guide

### Quick Start & Deployment
- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment documentation
- [Deployment Summary](DEPLOYMENT-SUMMARY.md) - Current deployment status and fixes

### Component Documentation
- [Frontend README](frontend/README.md) - Frontend development guide
- [User Service README](backend/user-service/README.md) - User service documentation
- [Ideas Service README](backend/ideas-service/README.md) - Ideas service documentation
- [Infrastructure README](infrastructure/README.md) - Infrastructure details

## Project Structure

```
.
├── backend/
│   ├── user-service/       # User authentication and management
│   └── ideas-service/      # Idea CRUD, assignments, comments
├── frontend/               # React application
├── infrastructure/         # CloudFormation templates
├── scripts/               # Deployment scripts
│   ├── setup-aws-profile.sh
│   ├── deploy-all.sh
│   ├── deploy-infrastructure.sh
│   ├── deploy-backend.sh
│   ├── deploy-frontend.sh
│   ├── create-admin-user.sh
│   ├── get-deployment-info.sh
│   └── cleanup.sh
└── .kiro/specs/           # Specification documents
```

## Development

### Backend Development

```bash
# User Service
cd backend/user-service
npm install
npm test
npm run build

# Ideas Service
cd backend/ideas-service
npm install
npm test
npm run build
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
```

## Deployment Commands

```bash
# Deploy everything
./scripts/deploy-all.sh

# Deploy individual components
./scripts/deploy-infrastructure.sh  # DynamoDB, Lambda, API Gateway
./scripts/deploy-backend.sh         # Lambda functions only
./scripts/deploy-frontend.sh        # Frontend to S3

# Utility commands
./scripts/get-deployment-info.sh    # Get URLs and resource names
./scripts/create-admin-user.sh      # Create admin user
./scripts/cleanup.sh                # Delete all resources
```

## Testing

### Backend Tests

```bash
# All tests
npm test

# User Service: 108 tests
cd backend/user-service && npm test

# Ideas Service: 115 tests
cd backend/ideas-service && npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## User Roles

### Employee
- Submit new ideas
- View own submitted ideas
- View comments on own ideas

### Reviewer
- Review pending ideas
- Assign ideas to implementers
- Approve or reject ideas
- Comment on any idea

### Implementer
- View assigned ideas
- Update status of assigned ideas
- Add comments to assigned ideas

### Admin
- All Reviewer and Implementer permissions
- User management (create, update, delete users)
- View all ideas regardless of status
- Update any idea status

## API Endpoints

### User Service
- `POST /auth/login` - Authenticate user
- `POST /users` - Create user (Admin)
- `GET /users` - List users (Admin/Reviewer)
- `GET /users/{userId}` - Get user by ID
- `PUT /users/{userId}` - Update user (Admin)
- `DELETE /users/{userId}` - Delete user (Admin)

### Ideas Service
- `POST /ideas` - Submit idea
- `GET /ideas` - List ideas (role-based filtering)
- `GET /ideas/{ideaId}` - Get idea by ID
- `PUT /ideas/{ideaId}/assign` - Assign idea (Reviewer/Admin)
- `PUT /ideas/{ideaId}/status` - Update status
- `POST /ideas/{ideaId}/comments` - Add comment
- `GET /ideas/{ideaId}/comments` - Get comments

## Security

- ✅ AWS credentials stored securely in `~/.aws/credentials`
- ✅ IAM roles for Lambda functions with least privilege
- ✅ Password hashing for user authentication
- ✅ Role-based access control on all endpoints
- ✅ CORS configured for API Gateway
- ✅ Input validation on all endpoints

## Monitoring

View CloudWatch logs:

```bash
# User Service logs
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

# Ideas Service logs
aws logs tail /aws/lambda/production-IdeasService --follow --profile employee-ideas --region us-east-2
```

## Cleanup

To delete all AWS resources:

```bash
./scripts/cleanup.sh
```

**WARNING**: This permanently deletes all data.

## Cost Estimate

With AWS Free Tier:
- DynamoDB: Free (25 GB storage, 25 WCU, 25 RCU)
- Lambda: Free (1M requests/month, 400,000 GB-seconds)
- API Gateway: Free (1M requests/month for 12 months)
- S3: Free (5 GB storage, 20,000 GET requests)

Estimated cost after free tier: $5-10/month for light usage

## Support

### Documentation Resources
For comprehensive guidance, refer to:
- [User Guide](USER-GUIDE.md) - Complete user manual for all roles
- [Developer Guide](DEVELOPER-GUIDE.md) - Development and troubleshooting
- [API Documentation](API-DOCUMENTATION.md) - API reference and examples
- [Deployment Summary](DEPLOYMENT-SUMMARY.md) - Current deployment status

### For Issues or Questions:
1. **Check Documentation**: Review relevant guides above
2. **Deployment Issues**: Check [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting
3. **System Errors**: Review CloudWatch logs for errors
4. **Authentication**: Verify AWS credentials and permissions
5. **User Issues**: Refer to [User Guide](USER-GUIDE.md) for role-specific help

### Quick Troubleshooting
- **Login Issues**: Check [User Guide - Troubleshooting](USER-GUIDE.md#troubleshooting)
- **API Errors**: Check [API Documentation - Error Responses](API-DOCUMENTATION.md#error-responses)
- **Deployment Problems**: Check [Deployment Summary](DEPLOYMENT-SUMMARY.md) for known issues
- **Development Issues**: Check [Developer Guide - Troubleshooting](DEVELOPER-GUIDE.md#troubleshooting)

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Acknowledgments

Built with:
- React 18
- AWS Lambda
- DynamoDB
- API Gateway
- TypeScript
- Vite
- Jest/Vitest
