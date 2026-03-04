#!/bin/bash

# Get deployment information

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"

echo "=========================================="
echo "Deployment Information"
echo "=========================================="
echo ""

aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
  --output table

echo ""
