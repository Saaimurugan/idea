# Quick Start Guide

Get the Employee Ideas Management System deployed to AWS in 5 minutes.

## Prerequisites

- AWS Account
- AWS CLI installed ([Download](https://aws.amazon.com/cli/))
- Node.js 18+ installed
- Git Bash (Windows) or Terminal (Mac/Linux)

## Step 1: Configure AWS Credentials (2 minutes)

Open Git Bash (Windows) or Terminal (Mac/Linux) and run:

```bash
./scripts/setup-aws-profile.sh
```

When prompted, enter:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region name**: `us-east-2`
- **Default output format**: `json`

✅ Your credentials are now stored securely in `~/.aws/credentials`

## Step 2: Deploy Everything (3 minutes)

```bash
./scripts/deploy-all.sh
```

This single command will:
1. ✅ Create DynamoDB tables
2. ✅ Deploy Lambda functions
3. ✅ Configure API Gateway with CORS
4. ✅ Deploy frontend to S3

Wait for completion (takes ~2-3 minutes).

## Step 3: Create Admin User (30 seconds)

```bash
./scripts/create-admin-user.sh
```

Enter:
- Username (e.g., `admin`)
- Password (e.g., `Admin123!`)
- Email (e.g., `admin@example.com`)

## Step 4: Access Your Application

The deployment script will output your **Website URL**. Open it in your browser and log in with your admin credentials.

Example: `http://production-employee-ideas-frontend-123456789.s3-website.us-east-2.amazonaws.com`

---

## That's It!

Your Employee Ideas Management System is now live on AWS.

### What's Deployed?

- **DynamoDB**: 2 tables (Users, Ideas) in us-east-2
- **Lambda**: 2 functions (User Service, Ideas Service) in us-east-2
- **API Gateway**: REST API with CORS enabled in us-east-2
- **S3**: Static website hosting in us-east-2

### Next Steps

1. **Create more users**: Use the Admin dashboard → User Management
2. **Submit ideas**: Log in as an Employee and submit ideas
3. **Review ideas**: Log in as a Reviewer to review and assign ideas
4. **Monitor**: Check CloudWatch logs for any issues

### Useful Commands

```bash
# Get deployment info
./scripts/get-deployment-info.sh

# View logs
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

# Delete everything
./scripts/cleanup.sh
```

### Troubleshooting

**Can't access website?**
- Check that the S3 bucket policy allows public access
- Verify the API Gateway URL is correct in the frontend build

**Login not working?**
- Verify the admin user was created successfully
- Check CloudWatch logs for Lambda errors

**Need help?**
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation
- Check CloudWatch logs for error messages

---

## Security Reminder

🔒 **Never commit AWS credentials to git**

Your credentials are stored in:
- `~/.aws/credentials` (secure)
- `~/.aws/config` (secure)

These files are automatically ignored by git.
