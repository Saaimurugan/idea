#!/bin/bash

# Create an admin user in DynamoDB
# This script creates the first admin user for the system

set -e

PROFILE="employee-ideas"
REGION="us-east-2"
STACK_NAME="employee-ideas-stack"

echo "=========================================="
echo "Create Admin User"
echo "=========================================="
echo ""

# Get DynamoDB table name
USERS_TABLE=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --profile $PROFILE \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`UsersTableName`].OutputValue' \
  --output text)

echo "Users Table: $USERS_TABLE"
echo ""

# Prompt for user details
read -p "Enter admin username: " USERNAME
read -sp "Enter admin password: " PASSWORD
echo ""
read -p "Enter admin email: " EMAIL

# Generate UUID for userId
USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Hash password (simple bcrypt-like hash - in production use proper bcrypt)
PASSWORD_HASH=$(echo -n "$PASSWORD" | openssl dgst -sha256 -binary | base64)

echo ""
echo "Creating admin user..."

# Create user in DynamoDB
aws dynamodb put-item \
  --table-name $USERS_TABLE \
  --item "{
    \"userId\": {\"S\": \"$USER_ID\"},
    \"username\": {\"S\": \"$USERNAME\"},
    \"email\": {\"S\": \"$EMAIL\"},
    \"passwordHash\": {\"S\": \"$PASSWORD_HASH\"},
    \"role\": {\"S\": \"Admin\"},
    \"createdAt\": {\"S\": \"$TIMESTAMP\"},
    \"updatedAt\": {\"S\": \"$TIMESTAMP\"}
  }" \
  --profile $PROFILE \
  --region $REGION

echo ""
echo "✓ Admin user created successfully!"
echo ""
echo "Username: $USERNAME"
echo "Role: Admin"
echo ""
echo "You can now log in to the application with these credentials."
