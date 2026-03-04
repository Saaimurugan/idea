#!/bin/bash

# Deploy Frontend to S3
# Region: us-east-2

set -e

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"

echo "=========================================="
echo "Deploying Frontend to S3"
echo "=========================================="
echo ""

# Get S3 bucket name and API Gateway URL from CloudFormation stack
echo "Getting deployment information from stack..."
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text)

echo "S3 Bucket: $S3_BUCKET"
echo "API Gateway URL: $API_URL"
echo ""

# Create .env file for frontend build
echo "Creating frontend environment configuration..."
cd frontend
cat > .env.production << EOF
VITE_API_BASE_URL=$API_URL
EOF

echo "✓ Environment configuration created"
echo ""

# Build frontend
echo "Building frontend..."
npm install
npm run build

echo "✓ Frontend build complete"
echo ""

# Deploy to S3
echo "Deploying to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --profile $PROFILE \
  --region $REGION \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --profile $PROFILE \
  --region $REGION \
  --cache-control "no-cache"

echo "✓ Files uploaded to S3"
echo ""

cd ..

# Get CloudFront distribution URL if exists
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

echo "=========================================="
echo "Frontend deployment complete!"
echo "=========================================="
echo ""
echo "Website URL: http://$S3_BUCKET.s3-website.$REGION.amazonaws.com"
if [ ! -z "$CLOUDFRONT_URL" ]; then
  echo "CloudFront URL: $CLOUDFRONT_URL"
fi
echo ""
