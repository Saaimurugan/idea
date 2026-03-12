# Employee Ideas Management System - Project Overview

## Introduction
The Employee Ideas Management System is a serverless web application designed to streamline the process of collecting, reviewing, and implementing employee ideas within an organization. The system provides a structured workflow for idea submission, review, assignment, and implementation tracking.

## Key Features
- **Role-Based Access Control**: Four distinct user roles with specific permissions
- **Idea Lifecycle Management**: Complete workflow from submission to implementation
- **Real-Time Collaboration**: Threaded comments and status updates
- **Serverless Architecture**: Built on AWS Lambda, DynamoDB, and API Gateway
- **Modern Frontend**: React 18 with TypeScript and Vite
- **Comprehensive Testing**: 223+ unit tests across backend services

## Business Value
- Increases employee engagement through idea contribution
- Provides transparency in idea review and implementation process
- Reduces administrative overhead with automated workflows
- Enables data-driven decision making with idea analytics

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Lambda        │
│   (React SPA)   │────│   (REST API)    │────│   Functions     │
│   S3 Hosting    │    │   CORS Enabled  │    │   Node.js 20    │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
                                                ┌─────────────────┐
                                                │   DynamoDB      │
                                                │   NoSQL Database│
                                                └─────────────────┘
```

### Component Details

#### 1. Frontend (React Application)
- **Technology**: React 18, TypeScript, Vite, React Router
- **State Management**: React Context API
- **Build Tool**: Vite for fast development and optimized production builds
- **Hosting**: AWS S3 static website hosting

#### 2. Backend Services (AWS Lambda)
- **User Service**: Handles authentication and user management
- **Ideas Service**: Manages ideas, assignments, comments, and status updates
- **Runtime**: Node.js 20
- **Framework**: Custom Lambda handlers with TypeScript
- **Database**: DynamoDB with Global Secondary Indexes

#### 3. Infrastructure (AWS)
- **API Gateway**: REST API with CORS support
- **DynamoDB**: Two tables (Users, Ideas) with proper indexing
- **S3**: Static website hosting for frontend
- **IAM**: Least-privilege roles for Lambda functions
- **CloudWatch**: Logging and monitoring

## User Roles and Permissions

### 1. Employee
**Responsibilities**: Submit ideas, track own submissions, collaborate on own ideas
**Permissions**:
- Submit new ideas
- View own submitted ideas
- View comments on own ideas
- Edit own ideas (before review)

### 2. Reviewer
**Responsibilities**: Review ideas, assign to implementers, approve/reject ideas
**Permissions**:
- View all pending and in-review ideas
- Assign ideas to implementers
- Approve or reject ideas with reasons
- Comment on any idea

### 3. Implementer
**Responsibilities**: Implement assigned ideas, update progress, report completion
**Permissions**:
- View assigned ideas
- Update status of assigned ideas
- Add comments to assigned ideas
- Request clarification from reviewers

### 4. Admin
**Responsibilities**: System administration, user management, oversight
**Permissions**:
- All Reviewer and Implementer permissions
- Create, update, and delete users
- View all ideas regardless of status
- Update any idea status

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Testing**: Vitest, React Testing Library

### Backend
- **Runtime**: Node.js 20
- **Language**: TypeScript 5.3
- **Database**: AWS DynamoDB
- **Authentication**: JWT, bcryptjs
- **Testing**: Jest, fast-check
- **Linting**: ESLint with TypeScript rules

### Infrastructure
- **Compute**: AWS Lambda
- **API**: API Gateway (HTTP API)
- **Storage**: DynamoDB, S3
- **Monitoring**: CloudWatch, X-Ray
- **Deployment**: CloudFormation, AWS CLI

## Project Structure
```
employee-ideas-management/
├── backend/
│   ├── user-service/           # User authentication and management
│   └── ideas-service/          # Idea management
├── frontend/                   # React application
├── scripts/                   # Deployment and utility scripts
├── .kiro/                    # Kiro IDE configuration
└── documentation/            # Project documentation
```

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js 18+ and npm
- Git for version control

### 5-Minute Deployment
```bash
# 1. Configure AWS profile
./scripts/setup-aws-profile.sh

# 2. Deploy everything
./scripts/deploy-all.sh

# 3. Create admin user
./scripts/create-admin-user.sh

# 4. Access application using provided URL
```

## Current Status
✅ **Deployed and Working**:
- User authentication and login
- Idea submission and listing
- Role-based dashboards
- API Gateway with CORS

⚠️ **In Progress**:
- Idea detail view (minor issue)
- Advanced filtering and search
- Email notifications

📋 **Planned Features**:
- File attachments for ideas
- Real-time notifications
- Advanced analytics dashboard
- Mobile application

## Support and Resources

### Documentation
- [User Guide](USER-GUIDE.md) - Complete user manual
- [API Documentation](API-DOCUMENTATION.md) - API reference
- [Developer Guide](DEVELOPER-GUIDE.md) - Development instructions
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions

### Support Channels
- **Technical Issues**: GitHub Issues
- **User Support**: support@example.com
- **Community**: Slack channel #employee-ideas
- **Documentation**: This guide and README files

## License
MIT License - See LICENSE file for details

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---
*Last Updated: March 12, 2026*
*Version: 1.0.0*