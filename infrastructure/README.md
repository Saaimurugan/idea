# Infrastructure

This directory contains the AWS CloudFormation template for deploying the Employee Ideas Management System infrastructure.

## Resources Created

### DynamoDB Tables

1. **Users Table** (`{Environment}-Users`)
   - Primary Key: `userId` (String)
   - GSI: `username-index` - For login lookups
   - GSI: `role-index` - For role-based queries
   - Billing Mode: PAY_PER_REQUEST

2. **Ideas Table** (`{Environment}-Ideas`)
   - Primary Key: `ideaId` (String)
   - GSI: `submitter-index` - For employee idea queries
   - GSI: `assignee-index` - For implementer idea queries
   - GSI: `status-index` - For reviewer queries
   - Billing Mode: PAY_PER_REQUEST

### Lambda Functions

1. **User Service** (`{Environment}-UserService`)
   - Runtime: Node.js 20.x
   - Handles user CRUD operations and authentication
   - Environment Variables:
     - `USERS_TABLE_NAME`: Name of the Users DynamoDB table
     - `ENVIRONMENT`: Current environment (dev/staging/prod)

2. **Ideas Service** (`{Environment}-IdeasService`)
   - Runtime: Node.js 20.x
   - Handles idea CRUD operations, assignments, and comments
   - Environment Variables:
     - `IDEAS_TABLE_NAME`: Name of the Ideas DynamoDB table
     - `USERS_TABLE_NAME`: Name of the Users DynamoDB table (for referential integrity checks)
     - `ENVIRONMENT`: Current environment

### API Gateway

- HTTP API Gateway with CORS enabled
- Routes:
  - `POST /auth/login` → User Service
  - `ANY /users/{proxy+}` → User Service
  - `ANY /ideas/{proxy+}` → Ideas Service

## Deployment

### Prerequisites

- AWS CLI installed and configured
- Appropriate AWS permissions (DynamoDB, Lambda, IAM, API Gateway)

### Deploy Stack

```bash
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name employee-ideas-management \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=dev
```

### Update Stack

To update the stack after making changes to the template:

```bash
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name employee-ideas-management \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=dev
```

### Delete Stack

```bash
aws cloudformation delete-stack --stack-name employee-ideas-management
```

## Outputs

After deployment, the stack provides the following outputs:

- `UsersTableName`: Name of the Users DynamoDB table
- `IdeasTableName`: Name of the Ideas DynamoDB table
- `UserServiceFunctionArn`: ARN of the User Service Lambda function
- `IdeasServiceFunctionArn`: ARN of the Ideas Service Lambda function
- `ApiEndpoint`: API Gateway endpoint URL

View outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name employee-ideas-management \
  --query 'Stacks[0].Outputs'
```

## Environment Parameters

The template supports multiple environments through the `Environment` parameter:

- `dev` (default): Development environment
- `staging`: Staging environment
- `prod`: Production environment

Each environment creates separate resources with the environment name as a prefix.

## IAM Roles

The template creates IAM roles with least-privilege access:

- **UserServiceExecutionRole**: Grants User Service access to Users table only
- **IdeasServiceExecutionRole**: Grants Ideas Service access to both Ideas and Users tables (for referential integrity checks)

Both roles include the `AWSLambdaBasicExecutionRole` managed policy for CloudWatch Logs access.

## Cost Considerations

- DynamoDB tables use PAY_PER_REQUEST billing mode (no upfront costs, pay per request)
- Lambda functions are billed per invocation and execution time
- API Gateway is billed per request
- Estimated cost for low-traffic development: $5-10/month

## Security Notes

- Lambda functions have minimal IAM permissions (least privilege)
- API Gateway has CORS enabled (configure allowed origins for production)
- DynamoDB tables are encrypted at rest by default
- Consider adding API Gateway authentication/authorization for production use
