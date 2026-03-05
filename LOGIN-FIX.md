# Login Issue - Diagnosis and Fix

## Problem
Your application is deployed and accessible, but login is not working. The frontend is making requests but getting errors.

## Root Cause
The Lambda functions in AWS still have placeholder code from the CloudFormation template. They haven't been updated with your actual application code yet. The deployment process has three stages:

1. ✅ **Infrastructure** (DynamoDB, Lambda placeholders, API Gateway, S3) - DONE
2. ❌ **Backend** (Update Lambda functions with actual code) - NOT DONE YET
3. ✅ **Frontend** (Build and upload to S3) - DONE

## Solution

Follow these steps in order:

### Step 1: Install Dependencies for Admin User Script

```bash
npm install
```

This installs the AWS SDK, bcrypt, and uuid packages needed for the admin user creation script.

### Step 2: Deploy Backend Lambda Functions

```bash
scripts\deploy-backend.bat
```

This will:
- Build the User Service (authentication, user management)
- Build the Ideas Service (ideas, comments, assignments)
- Package both services with their dependencies
- Upload them to AWS Lambda
- Update the Lambda function code

**Expected time:** 3-5 minutes

**What you'll see:**
```
==========================================
Deploying Backend Lambda Functions
==========================================

Getting Lambda function names from stack...
User Service Function: prod-UserService
Ideas Service Function: prod-IdeasService

Building User Service...
[npm install output]
[build output]

Creating deployment package for User Service...
Deploying User Service to Lambda...
[OK] User Service deployed

Building Ideas Service...
[npm install output]
[build output]

Creating deployment package for Ideas Service...
Deploying Ideas Service to Lambda...
[OK] Ideas Service deployed

==========================================
Backend deployment complete!
==========================================
```

### Step 3: Create Admin User

```bash
scripts\create-admin-user.bat
```

This will prompt you for:
- **Username** (e.g., "admin")
- **Email** (e.g., "admin@company.com")
- **Password** (minimum 8 characters, will be hidden as you type)

The script uses proper bcrypt hashing (same as your backend) to securely store the password.

**Example:**
```
==========================================
Create Admin User
==========================================

Region: us-east-2
Table: prod-Users

Enter admin username: admin
Enter admin email: admin@company.com
Enter admin password: ********

Creating admin user...

✓ Admin user created successfully!

Username: admin
Email: admin@company.com
Role: Admin

You can now log in to the application with these credentials.
```

### Step 4: Test Login

1. Go to your website URL (the one shown in the browser screenshot)
2. Enter the admin username and password you just created
3. Click "Sign In"
4. You should be redirected to the Admin Dashboard

## Verification

After completing these steps, you can verify everything is working:

### Check API Gateway
```bash
scripts\get-deployment-info.bat
```

Look for the `ApiGatewayUrl` - it should be something like:
```
https://xxxxx.execute-api.us-east-2.amazonaws.com/prod
```

### Test API Endpoint
```bash
curl https://YOUR-API-URL/users
```

You should get a response (even if it's an authentication error, that means the API is working).

### Check Lambda Logs
If you encounter issues, check the Lambda logs:

```bash
# User Service logs
aws logs tail /aws/lambda/prod-UserService --follow --profile employee-ideas --region us-east-2

# Ideas Service logs
aws logs tail /aws/lambda/prod-IdeasService --follow --profile employee-ideas --region us-east-2
```

## Troubleshooting

### "Module not found" errors during backend deployment
**Solution:** Make sure you're in the project root directory when running the script.

### "Cannot find module 'bcryptjs'" when creating admin user
**Solution:** Run `npm install` in the project root directory first.

### Login still fails after backend deployment
**Possible causes:**
1. **No admin user created** - Run `scripts\create-admin-user.bat`
2. **Wrong credentials** - Double-check username and password
3. **Browser cache** - Hard refresh (Ctrl+Shift+R) or clear cache
4. **API URL mismatch** - Check browser console (F12) to see what URL the frontend is calling

### "Network error" in browser
**Possible causes:**
1. **CORS issue** - Check API Gateway CORS configuration (should be set to `*`)
2. **Lambda function error** - Check CloudWatch logs
3. **Wrong API URL** - Frontend should be calling your API Gateway URL

### Check Frontend API Configuration
The frontend should have been built with the correct API URL. You can verify by checking:

```bash
# In the frontend directory
cat frontend/.env.production
```

Should show:
```
VITE_API_BASE_URL=https://xxxxx.execute-api.us-east-2.amazonaws.com/prod
```

If this is wrong, redeploy the frontend:
```bash
scripts\deploy-frontend.bat
```

## Next Steps

Once login is working:

1. **Create additional users** - Use the Admin Dashboard to create Reviewers, Implementers, and Employees
2. **Test idea submission** - Log in as an Employee and submit an idea
3. **Test review workflow** - Log in as a Reviewer and review ideas
4. **Test assignment** - Assign ideas to Implementers
5. **Test comments** - Add comments to ideas

## Architecture Overview

```
Browser
  ↓
S3 (Frontend - React App)
  ↓
API Gateway (CORS enabled)
  ↓
Lambda Functions
  ├── User Service (auth, users)
  └── Ideas Service (ideas, comments)
  ↓
DynamoDB Tables
  ├── prod-Users
  └── prod-Ideas
```

## Important Files

- `scripts/deploy-backend.bat` - Deploys Lambda functions
- `scripts/create-admin-user.bat` - Creates admin user (wrapper)
- `scripts/create-admin-user.js` - Node.js script for admin user creation
- `scripts/get-deployment-info.bat` - Shows all deployment URLs
- `DEPLOYMENT-CHECKLIST.md` - Complete deployment checklist
