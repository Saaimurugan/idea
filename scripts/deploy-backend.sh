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
rm -rf dist
mkdir -p dist

# Install production dependencies in dist folder
echo "Installing production dependencies..."
cp package.json dist/
cp package-lock.json dist/ 2>/dev/null || true
cd dist
npm install --production --no-package-lock
cd ..

# Copy built files
cp -r build/* dist/

# Create zip file
cd dist
zip -r ../user-service.zip . > /dev/null
cd ..

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
rm -rf dist
mkdir -p dist

# Install production dependencies in dist folder
echo "Installing production dependencies..."
cp package.json dist/
cp package-lock.json dist/ 2>/dev/null || true
cd dist
npm install --production --no-package-lock
cd ..

# Copy built files
cp -r build/* dist/

# Create zip file
cd dist
zip -r ../ideas-service.zip . > /dev/null
cd ..

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
