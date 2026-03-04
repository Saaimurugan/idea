# Deployment Checklist

Use this checklist to ensure a smooth deployment.

## ⚠️ CRITICAL: Before You Start

- [ ] **ROTATE YOUR AWS CREDENTIALS IMMEDIATELY**
  - The credentials you shared earlier are now compromised
  - Go to AWS IAM Console → Users → Security Credentials
  - Delete or deactivate the exposed access key
  - Create new credentials

## Prerequisites

- [ ] AWS Account created
- [ ] AWS CLI installed ([Download](https://aws.amazon.com/cli/))
- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Git Bash (Windows) or Terminal (Mac/Linux)
- [ ] Project files downloaded/cloned

## Step 1: Secure Credential Setup

- [ ] Open Git Bash (Windows) or Terminal (Mac/Linux)
- [ ] Navigate to project directory: `cd /path/to/project`
- [ ] Run: `./scripts/setup-aws-profile.sh` (or `scripts\setup-aws-profile.bat` on Windows CMD)
- [ ] Enter your **NEW** AWS Access Key ID
- [ ] Enter your **NEW** AWS Secret Access Key
- [ ] Enter region: `us-east-2`
- [ ] Enter output format: `json`
- [ ] Verify: `aws sts get-caller-identity --profile employee-ideas`

## Step 2: Deploy Infrastructure

- [ ] Run: `./scripts/deploy-all.sh`
- [ ] Wait for deployment to complete (~3 minutes)
- [ ] Note the Website URL from output
- [ ] Note the API Gateway URL from output

## Step 3: Create Admin User

- [ ] Run: `./scripts/create-admin-user.sh`
- [ ] Enter admin username (e.g., `admin`)
- [ ] Enter admin password (e.g., `Admin123!`)
- [ ] Enter admin email (e.g., `admin@example.com`)
- [ ] Verify user created successfully

## Step 4: Verify Deployment

- [ ] Open Website URL in browser
- [ ] Verify login page loads
- [ ] Log in with admin credentials
- [ ] Verify admin dashboard loads
- [ ] Check User Management page
- [ ] Check All Ideas page

## Step 5: Test Functionality

### User Management
- [ ] Create an Employee user
- [ ] Create a Reviewer user
- [ ] Create an Implementer user
- [ ] Log out

### Employee Workflow
- [ ] Log in as Employee
- [ ] Submit a new idea
- [ ] Verify idea appears in "My Ideas"
- [ ] Log out

### Reviewer Workflow
- [ ] Log in as Reviewer
- [ ] Verify idea appears in "Review Ideas"
- [ ] Assign idea to Implementer
- [ ] Log out

### Implementer Workflow
- [ ] Log in as Implementer
- [ ] Verify idea appears in "My Assigned Ideas"
- [ ] Update idea status to "In Progress"
- [ ] Add a comment
- [ ] Log out

### Admin Workflow
- [ ] Log in as Admin
- [ ] Verify all ideas visible in "All Ideas"
- [ ] Verify all users visible in "User Management"

## Step 6: Monitor and Verify

- [ ] Check CloudWatch logs for errors:
  ```bash
  aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2
  ```
- [ ] Verify DynamoDB tables created:
  ```bash
  aws dynamodb list-tables --profile employee-ideas --region us-east-2
  ```
- [ ] Verify Lambda functions deployed:
  ```bash
  aws lambda list-functions --profile employee-ideas --region us-east-2
  ```
- [ ] Test API Gateway endpoint:
  ```bash
  curl {API_GATEWAY_URL}/health
  ```

## Troubleshooting

### If deployment fails:

- [ ] Check AWS credentials are correct
- [ ] Verify AWS CLI is installed: `aws --version`
- [ ] Check CloudFormation stack events:
  ```bash
  aws cloudformation describe-stack-events --stack-name employee-ideas-stack --profile employee-ideas --region us-east-2
  ```
- [ ] Review error messages in terminal output

### If login doesn't work:

- [ ] Verify admin user was created in DynamoDB
- [ ] Check CloudWatch logs for Lambda errors
- [ ] Verify API Gateway URL is correct in frontend
- [ ] Check browser console for errors

### If CORS errors occur:

- [ ] Verify API Gateway CORS configuration
- [ ] Check that API Gateway URL matches frontend configuration
- [ ] Clear browser cache and try again

## Cleanup (When Done Testing)

- [ ] Run: `./scripts/cleanup.sh`
- [ ] Confirm deletion when prompted
- [ ] Verify all resources deleted in AWS Console

## Security Checklist

- [ ] AWS credentials stored in `~/.aws/credentials` (not in code)
- [ ] `.aws/` directory is in `.gitignore`
- [ ] No credentials committed to git
- [ ] Old/exposed credentials rotated
- [ ] CloudWatch logging enabled
- [ ] IAM roles use least privilege

## Production Readiness (Optional)

If deploying to production:

- [ ] Enable CloudFront for HTTPS
- [ ] Configure custom domain
- [ ] Enable DynamoDB backups
- [ ] Set up CloudWatch alarms
- [ ] Implement rate limiting
- [ ] Use AWS Secrets Manager
- [ ] Enable AWS WAF
- [ ] Implement proper password hashing (bcrypt)
- [ ] Add API authentication
- [ ] Set up CI/CD pipeline
- [ ] Perform security audit
- [ ] Load testing
- [ ] Disaster recovery plan

## Documentation Review

- [ ] Read [QUICKSTART.md](QUICKSTART.md)
- [ ] Review [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Check [README.md](README.md)
- [ ] Review [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)

## Support Resources

- **CloudWatch Logs**: Check for Lambda errors
- **CloudFormation Events**: Check for deployment issues
- **AWS Console**: Verify resources created
- **Documentation**: See DEPLOYMENT.md for detailed troubleshooting

## ✅ Deployment Complete!

Once all items are checked, your Employee Ideas Management System is successfully deployed and ready to use!

**Website URL**: ___________________________________

**API Gateway URL**: ___________________________________

**Admin Username**: ___________________________________

**Admin Password**: ___________________________________ (store securely!)

---

## Quick Reference Commands

```bash
# Get deployment info
./scripts/get-deployment-info.sh

# View logs
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

# Redeploy frontend
./scripts/deploy-frontend.sh

# Redeploy backend
./scripts/deploy-backend.sh

# Delete everything
./scripts/cleanup.sh
```
