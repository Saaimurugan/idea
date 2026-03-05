#!/bin/bash

# Deploy Backend Lambda Functions
# Region: us-east-2

set -e

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"

echo "=========================================="
echo "Deploying Backend Lambda Functions"
echo "=========================================="
echo ""

# Get Lambda function names from CloudFormation stack
echo "Getting Lambda function names from stack..."
USER_SERVICE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`UserServiceFunctionName`].OutputValue' \
  --output text)

IDEAS_SERVICE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`IdeasServiceFunctionName`].OutputValue' \
  --output text)

echo "User Service Function: $USER_SERVICE_FUNCTION"
echo "Ideas Service Function: $IDEAS_SERVICE_FUNCTION"
echo ""

# Build and deploy User Service
echo "Building User Service..."
cd backend/user-service
npm install
npm run build

echo "Creating deployment package for User Service..."
rm -rf deployment-package user-service.zip
mkdir -p deployment-package

# Copy built files (TypeScript outputs to dist folder)
echo "Copying built files..."
cp -r dist/* deployment-package/

# Install production dependencies in deployment-package folder
echo "Installing production dependencies..."
cp package.json deployment-package/
cp package-lock.json deployment-package/ 2>/dev/null || true
cd deployment-package
npm install --production --no-package-lock
cd ..

# Create zip file
cd deployment-package
zip -r ../user-service.zip . > /dev/null
cd ..

# Clean up
rm -rf deployment-package

echo "Deploying User Service to Lambda..."
aws lambda update-function-code \
  --function-name $USER_SERVICE_FUNCTION \
  --zip-file fileb://user-service.zip \
  --profile $PROFILE \
  --region $REGION

echo "✓ User Service deployed"
echo ""

# Build and deploy Ideas Service
echo "Building Ideas Service..."
cd ../ideas-service
npm install
npm run build

echo "Creating deployment package for Ideas Service..."
rm -rf deployment-package ideas-service.zip
mkdir -p deployment-package

# Copy built files (TypeScript outputs to dist folder)
echo "Copying built files..."
cp -r dist/* deployment-package/

# Install production dependencies in deployment-package folder
echo "Installing production dependencies..."
cp package.json deployment-package/
cp package-lock.json deployment-package/ 2>/dev/null || true
cd deployment-package
npm install --production --no-package-lock
cd ..

# Create zip file
cd deployment-package
zip -r ../ideas-service.zip . > /dev/null
cd ..

# Clean up
rm -rf deployment-package

echo "Deploying Ideas Service to Lambda..."
aws lambda update-function-code \
  --function-name $IDEAS_SERVICE_FUNCTION \
  --zip-file fileb://ideas-service.zip \
  --profile $PROFILE \
  --region $REGION

echo "✓ Ideas Service deployed"
echo ""

cd ../..

echo "=========================================="
echo "Backend deployment complete!"
echo "=========================================="
