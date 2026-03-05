# Deployment Checklist

## Current Status
✅ Infrastructure deployed (DynamoDB, Lambda, API Gateway, S3)
✅ Frontend deployed to S3
❌ Backend Lambda functions need actual code deployment
❌ Admin user needs to be created

## Steps to Fix Login Issue

### Step 1: Deploy Backend Lambda Functions

The Lambda functions currently have placeholder code. Deploy the actual application code:

```bash
scripts\deploy-backend.bat
```

This will:
- Build both User Service and Ideas Service
- Package them with dependencies
- Upload to Lambda functions
- Update the function code

**Expected time:** 3-5 minutes

### Step 2: Verify API Gateway is Working

After backend deployment, test the API endpoint:

```bash
# Get your API Gateway URL
scripts\get-deployment-info.bat
```

Look for the `ApiGatewayUrl` output (should be something like `https://xxxxx.execute-api.us-east-2.amazonaws.com/prod`)

Test the endpoint:
```bash
curl https://YOUR-API-URL/users
```

You should get a response (even if it's an error about authentication, that means the API is working).

### Step 3: Create Admin User

Once the backend is deployed, create an admin user:

```bash
scripts\create-admin-user.bat
```

This will prompt you for:
- Username (e.g., "admin")
- Email (e.g., "admin@company.com")
- Password (choose a secure password)

### Step 4: Test Login

1. Go to your website URL (from `get-deployment-info.bat`)
2. Use the admin credentials you just created
3. You should be able to log in successfully

## Troubleshooting

### If login still fails:

1. **Check browser console** (F12 → Console tab)
   - Look for network errors
   - Check if API URL is correct

2. **Check Network tab** (F12 → Network tab)
   - Look at the request to `/auth/login`
   - Check the request URL - it should point to your API Gateway
   - Check the response - what error is returned?

3. **Verify API Gateway URL in frontend**
   - The frontend should be built with `VITE_API_BASE_URL` pointing to your API Gateway
   - Check `frontend/.env.production` file

4. **Check Lambda logs**
   ```bash
   # View User Service logs
   aws logs tail /aws/lambda/prod-UserService --follow --profile employee-ideas --region us-east-2
   ```

5. **Verify DynamoDB tables exist**
   ```bash
   aws dynamodb list-tables --profile employee-ideas --region us-east-2
   ```
   Should show: `prod-Users` and `prod-Ideas`

### Common Issues:

**Issue:** "Network error" in browser
- **Cause:** CORS not configured or API Gateway URL wrong
- **Fix:** Verify API Gateway has CORS enabled (it should from CloudFormation)

**Issue:** "User not found" error
- **Cause:** Admin user not created yet
- **Fix:** Run `scripts\create-admin-user.bat`

**Issue:** "Internal server error"
- **Cause:** Lambda function error
- **Fix:** Check CloudWatch logs for the Lambda function

**Issue:** Frontend shows old cached version
- **Cause:** Browser cache
- **Fix:** Hard refresh (Ctrl+Shift+R) or clear browser cache

## Quick Reference Commands

```bash
# Get all deployment info
scripts\get-deployment-info.bat

# Redeploy backend only
scripts\deploy-backend.bat

# Redeploy frontend only
scripts\deploy-frontend.bat

# Create admin user
scripts\create-admin-user.bat

# View Lambda logs
aws logs tail /aws/lambda/prod-UserService --follow --profile employee-ideas --region us-east-2
aws logs tail /aws/lambda/prod-IdeasService --follow --profile employee-ideas --region us-east-2

# Test API endpoint
curl https://YOUR-API-URL/users
```

## Next Steps After Login Works

1. Create additional users (Reviewers, Implementers, Employees)
2. Test idea submission
3. Test idea review workflow
4. Test idea assignment
5. Test comments functionality
