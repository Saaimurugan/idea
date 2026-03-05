# Backend Deployment Fix

## Issue
The backend deployment script was failing because:
1. It was using `npm install --production` which skips TypeScript (a dev dependency)
2. TypeScript is needed to compile the TypeScript code to JavaScript
3. Without TypeScript, the `npm run build` command failed

## Fix Applied
Updated both `scripts/deploy-backend.bat` and `scripts/deploy-backend.sh` to:

1. **Install all dependencies** (including dev dependencies like TypeScript) for building
2. **Build the code** using TypeScript compiler
3. **Create a clean dist folder** for deployment
4. **Install only production dependencies** in the dist folder
5. **Copy built JavaScript files** to dist folder
6. **Create zip package** with only production code and dependencies
7. **Add error checking** to stop on failures

## How It Works Now

### Build Phase (with dev dependencies)
```bash
npm install          # Installs ALL dependencies including TypeScript
npm run build        # Compiles TypeScript to JavaScript
```

### Package Phase (production only)
```bash
mkdir dist
cp package.json dist/
cd dist
npm install --production --no-package-lock  # Only production dependencies
cd ..
cp build/* dist/     # Copy compiled JavaScript files
zip dist             # Create deployment package
```

### Deploy Phase
```bash
aws lambda update-function-code --zip-file fileb://service.zip
```

## Try Again

Now run the deployment script again:

```bash
scripts\deploy-backend.bat
```

This time it should:
1. ✅ Install dependencies (including TypeScript)
2. ✅ Build successfully
3. ✅ Create deployment packages
4. ✅ Upload to Lambda

**Expected time:** 3-5 minutes

## What You'll See

```
==========================================
Deploying Backend Lambda Functions
==========================================

Getting Lambda function names from stack...
User Service Function: prod-UserService
Ideas Service Function: prod-IdeasService

Building User Service...
[npm install output - will include TypeScript]
[build output - TypeScript compilation]

Creating deployment package for User Service...
Installing production dependencies...
[OK] User Service deployed

Building Ideas Service...
[npm install output - will include TypeScript]
[build output - TypeScript compilation]

Creating deployment package for Ideas Service...
Installing production dependencies...
[OK] Ideas Service deployed

==========================================
Backend deployment complete!
==========================================
```

## After Successful Deployment

Once the backend is deployed, proceed with creating an admin user:

```bash
# First install dependencies for the admin user script
npm install

# Then create admin user
scripts\create-admin-user.bat
```

## Troubleshooting

### If you still get "tsc is not recognized"
Make sure you're running from the project root directory and that the backend services have their dependencies:

```bash
# From project root
cd backend\user-service
npm install
cd ..\..
```

### If build fails with TypeScript errors
Check the TypeScript compilation errors and fix any code issues. The build should succeed since all tests passed earlier.

### If Lambda deployment fails
Check that:
1. AWS credentials are configured correctly
2. Lambda functions exist (from infrastructure deployment)
3. You have permissions to update Lambda functions
