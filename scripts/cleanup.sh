#!/bin/bash

# Cleanup - Delete all AWS resources

set -e

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"

echo "=========================================="
echo "WARNING: This will delete all resources"
echo "=========================================="
echo ""
read -p "Are you sure you want to delete everything? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "Getting S3 bucket name..."
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$S3_BUCKET" ]; then
    echo "Emptying S3 bucket: $S3_BUCKET"
    aws s3 rm s3://$S3_BUCKET/ --recursive --profile $PROFILE --region $REGION
fi

echo ""
echo "Deleting CloudFormation stack..."
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION

echo "Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION

echo ""
echo "✓ All resources deleted"
