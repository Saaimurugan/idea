#!/bin/bash

# Setup AWS CLI Profile for Employee Ideas Management System
# This script helps you configure AWS credentials securely

echo "=========================================="
echo "AWS Profile Setup"
echo "=========================================="
echo ""
echo "This will configure an AWS CLI profile named 'employee-ideas'"
echo "Your credentials will be stored securely in ~/.aws/credentials"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed"
    echo "Please install it first: https://aws.amazon.com/cli/"
    exit 1
fi

echo "Configuring AWS profile 'employee-ideas'..."
echo ""

# Configure the profile
aws configure --profile employee-ideas

echo ""
echo "=========================================="
echo "Profile configured successfully!"
echo "=========================================="
echo ""
echo "To verify your configuration:"
echo "  aws sts get-caller-identity --profile employee-ideas"
echo ""
echo "Your credentials are stored in: ~/.aws/credentials"
echo "Your config is stored in: ~/.aws/config"
echo ""
