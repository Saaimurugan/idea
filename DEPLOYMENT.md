# Deployment Guide

This guide walks you through deploying the Employee Ideas Management System to AWS using secure credential management.

## Prerequisites

1. **AWS CLI installed**: [Installation Guide](https://aws.amazon.com/cli/)
2. **Node.js 18+** installed
3. **AWS Account** with appropriate permissions
4. **Bash shell** (Git Bash on Windows, Terminal on Mac/Linux)

## Step 1: Configure AWS Credentials Securely

**IMPORTANT**: Never share or commit AWS credentials. Always use AWS CLI profiles.

Run the setup script:

```bash
chmod +x scripts/*.sh
./scripts/setup-aws-profile.sh
```

When prompted, enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-2`
- Default output format: `json`

Your credentials will be stored securely in `~/.aws/credentials`.

## Step 2: Deploy Everything

Deploy infrastructure, backend, and frontend in one command:

```bash
./scripts/deploy-all.sh
```

This will:
1. Create DynamoDB tables (Users, Ideas)
2. Deploy Lambda functions (User Service, Ideas Service)
3. Configure API Gateway with CORS enabled
4. Deploy frontend to S3
5. Output all URLs and endpoints

## Step 3: Create Admin User

Create the first admin user:

```bash
./scripts/create-admin-user.sh
```

Follow the prompts to set username, password, and email.

## Step 4: Access Your Application

After deployment completes, you'll see:
- **Website URL**: Your frontend application
- **API Gateway URL**: Your backend API

Open the Website URL in your browser and log in with your admin credentials.

---

## Individual Deployment Commands

If you need to deploy components separately:

### Deploy Infrastructure Only
```bash
./scripts/deploy-infrastructure.sh
```

### Deploy Backend Only
```bash
./scripts/deploy-backend.sh
```

### Deploy Frontend Only
```bash
./scripts/deploy-frontend.sh
```

---

## Useful Commands

### Get Deployment Information
```bash
./scripts/get-deployment-info.sh
```

### View CloudWatch Logs
```bash
# User Service logs
aws logs tail /aws/lambda/employee-ideas-user-service --follow --profile employee-ideas --region us-east-2

# Ideas Service logs
aws logs tail /aws/lambda/employee-ideas-ideas-service --follow --profile employee-ideas --region us-east-2
```

### Test API Endpoints
```bash
# Get API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name employee-ideas-stack \
  --profile employee-ideas \
  --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text)

# Test health endpoint
curl $API_URL/health
```

---

## Cleanup

To delete all AWS resources:

```bash
./scripts/cleanup.sh
```

**WARNING**: This will permanently delete all data and resources.

---

## Architecture

The deployment creates:

### DynamoDB Tables
- **Users**: Stores user accounts with GSIs for username and role lookups
- **Ideas**: Stores ideas with GSIs for submitter, assignee, and status queries

### Lambda Functions
- **User Service**: Handles authentication and user management
- **Ideas Service**: Handles idea CRUD, assignments, and comments

### API Gateway
- REST API with CORS enabled (`Access-Control-Allow-Origin: *`)
- Integrated with Lambda functions
- Endpoints:
  - `/auth/*` - Authentication
  - `/users/*` - User management
  - `/ideas/*` - Idea management

### S3 + CloudFront
- S3 bucket for static website hosting
- CloudFront distribution for CDN (optional)

---

## Troubleshooting

### "Profile not found" error
Run `./scripts/setup-aws-profile.sh` to configure credentials.

### "Stack already exists" error
The stack is already deployed. Use individual deployment scripts to update components.

### Lambda deployment fails
Check that you have the correct IAM permissions and that the Lambda functions are building correctly:
```bash
cd backend/user-service && npm run build
cd backend/ideas-service && npm run build
```

### Frontend not loading
1. Check that the API URL is correct in the frontend build
2. Verify CORS is enabled on API Gateway
3. Check browser console for errors

### Database connection errors
Ensure Lambda functions have the correct environment variables:
- `USERS_TABLE`
- `IDEAS_TABLE`

---

## Security Best Practices

1. ✅ **Never commit credentials** to git
2. ✅ **Use AWS CLI profiles** for credential management
3. ✅ **Rotate credentials regularly**
4. ✅ **Use IAM roles** for Lambda functions
5. ✅ **Enable CloudWatch logging** for monitoring
6. ✅ **Use HTTPS** in production (CloudFront)
7. ✅ **Implement proper authentication** (JWT tokens)

---

## Production Considerations

Before going to production:

1. **Enable CloudFront** for HTTPS and CDN
2. **Configure custom domain** with Route 53
3. **Enable DynamoDB backups** and point-in-time recovery
4. **Set up CloudWatch alarms** for monitoring
5. **Implement rate limiting** on API Gateway
6. **Use AWS Secrets Manager** for sensitive configuration
7. **Enable AWS WAF** for API protection
8. **Implement proper password hashing** (bcrypt)
9. **Add API authentication** (API keys or Cognito)
10. **Set up CI/CD pipeline** for automated deployments

---

## Support

For issues or questions:
1. Check CloudWatch logs for errors
2. Review the CloudFormation stack events
3. Verify all prerequisites are met
4. Ensure AWS credentials have sufficient permissions
