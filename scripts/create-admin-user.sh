#!/bin/bash

# Create an admin user in DynamoDB

set -e

export AWS_PROFILE="employee-ideas"
export AWS_REGION="us-east-2"
export ENVIRONMENT="prod"

echo "Running admin user creation script..."
echo ""

# Run the Node.js script
node scripts/create-admin-user.js

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to create admin user"
    exit 1
fi
