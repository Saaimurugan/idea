#!/bin/bash

# Complete Deployment Script
# Deploys infrastructure, backend, and frontend

set -e

echo "=========================================="
echo "Employee Ideas Management System"
echo "Complete Deployment"
echo "=========================================="
echo ""

# Check if profile exists
if ! aws configure list --profile employee-ideas &> /dev/null; then
    echo "ERROR: AWS profile 'employee-ideas' not found"
    echo "Please run: ./scripts/setup-aws-profile.sh"
    exit 1
fi

echo "Starting deployment..."
echo ""

# Step 1: Deploy Infrastructure
echo "Step 1/3: Deploying Infrastructure..."
./scripts/deploy-infrastructure.sh

echo ""
echo "Waiting 30 seconds for resources to stabilize..."
sleep 30
echo ""

# Step 2: Deploy Backend
echo "Step 2/3: Deploying Backend..."
./scripts/deploy-backend.sh

echo ""

# Step 3: Deploy Frontend
echo "Step 3/3: Deploying Frontend..."
./scripts/deploy-frontend.sh

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Access your application using the Website URL above"
echo "2. Create an admin user to get started"
echo "3. Review CloudWatch logs for any issues"
echo ""
