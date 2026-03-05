#!/bin/bash

# Deploy Infrastructure (DynamoDB, Lambda, API Gateway) using CloudFormation
# Region: us-east-2

set -e

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"
TEMPLATE_FILE="infrastructure/cloudformation.yaml"

echo "=========================================="
echo "Deploying Infrastructure to AWS"
echo "=========================================="
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo ""

# Validate CloudFormation template
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://$TEMPLATE_FILE \
  --profile $PROFILE \
  --region $REGION

echo "✓ Template is valid"
echo ""

# Deploy the stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file $TEMPLATE_FILE \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile $PROFILE \
  --region $REGION \
  --parameter-overrides \
    Environment=prod

echo ""
echo "✓ Stack deployment initiated"
echo ""

# Wait for stack to complete
echo "Waiting for stack to complete..."
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION 2>/dev/null || \
aws cloudformation wait stack-update-complete \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION 2>/dev/null

echo "✓ Stack deployment complete"
echo ""

# Get stack outputs
echo "=========================================="
echo "Stack Outputs:"
echo "=========================================="
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table

echo ""
echo "Deployment complete!"
