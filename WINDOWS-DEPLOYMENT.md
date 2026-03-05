# Windows Deployment Guide

Complete guide for deploying the Employee Ideas Management System on Windows.

## Prerequisites

- Windows 10/11
- AWS CLI installed ([Download](https://aws.amazon.com/cli/))
- Node.js 18+ installed ([Download](https://nodejs.org/))
- PowerShell or Command Prompt

## Quick Start

### Step 1: Configure AWS Credentials

Open Command Prompt or PowerShell and run:

```cmd
scripts\setup-aws-profile.bat
```

When prompted, enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-2`
- Default output format: `json`

### Step 2: Deploy Everything

```cmd
scripts\deploy-all.bat
```

This will deploy:
1. DynamoDB tables
2. Lambda functions
3. API Gateway
4. S3 bucket with frontend

Wait for completion (~3 minutes).

### Step 3: Create Admin User

```cmd
scripts\create-admin-user.bat
```

Enter:
- Username (e.g., `admin`)
- Password (e.g., `Admin123!`)
- Email (e.g., `admin@example.com`)

### Step 4: Access Your Application

The deployment will output your Website URL. Open it in your browser and log in.

---

## Individual Deployment Commands

### Deploy Infrastructure Only
```cmd
scripts\deploy-infrastructure.bat
```

### Deploy Backend Only
```cmd
scripts\deploy-backend.bat
```

### Deploy Frontend Only
```cmd
scripts\deploy-frontend.bat
```

---

## Useful Commands

### Get Deployment Information
```cmd
scripts\get-deployment-info.bat
```

### View CloudWatch Logs
```cmd
REM User Service logs
aws logs tail /aws/lambda/production-UserService --follow --profile employee-ideas --region us-east-2

REM Ideas Service logs
aws logs tail /aws/lambda/production-IdeasService --follow --profile employee-ideas --region us-east-2
```

### Delete All Resources
```cmd
scripts\cleanup.bat
```

---

## Troubleshooting

### "AWS CLI not found" error

Install AWS CLI:
1. Download from https://aws.amazon.com/cli/
2. Run the installer
3. Restart Command Prompt
4. Verify: `aws --version`

### "Profile not found" error

Run the setup script:
```cmd
scripts\setup-aws-profile.bat
```

### PowerShell execution policy error

If you get an execution policy error, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js not found

Install Node.js:
1. Download from https://nodejs.org/
2. Run the installer
3. Restart Command Prompt
4. Verify: `node --version`

### Build errors

Make sure you have all dependencies installed:
```cmd
cd backend\user-service
npm install
npm run build

cd ..\ideas-service
npm install
npm run build

cd ..\..\frontend
npm install
npm run build
```

---

## Using Git Bash (Alternative)

If you have Git Bash installed, you can use the Linux-style scripts:

```bash
# Configure credentials
./scripts/setup-aws-profile.sh

# Deploy everything
./scripts/deploy-all.sh

# Create admin user
./scripts/create-admin-user.sh
```

---

## Local Development on Windows

See [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md) for running the system locally.

Quick start:
```cmd
REM Install dependencies
npm install
cd backend\user-service && npm install && cd ..\..
cd backend\ideas-service && npm install && cd ..\..
cd frontend && npm install && cd ..

REM Start services (requires Git Bash or WSL)
npm run dev
```

---

## Next Steps

1. Access your application using the Website URL
2. Log in with your admin credentials
3. Create additional users via User Management
4. Test the complete workflow

---

## Support

For issues:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
2. Review CloudWatch logs for errors
3. Verify AWS credentials and permissions
4. Check that all prerequisites are installed

---

## Quick Reference

```cmd
REM Setup
scripts\setup-aws-profile.bat

REM Deploy
scripts\deploy-all.bat

REM Create admin
scripts\create-admin-user.bat

REM Get info
scripts\get-deployment-info.bat

REM Cleanup
scripts\cleanup.bat
```
