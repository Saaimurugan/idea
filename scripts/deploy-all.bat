@echo off
REM Complete Deployment Script for Windows
REM Deploys infrastructure, backend, and frontend

setlocal enabledelayedexpansion

echo ==========================================
echo Employee Ideas Management System
echo Complete Deployment
echo ==========================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not installed
    echo Please install it first: https://aws.amazon.com/cli/
    exit /b 1
)

REM Check if profile exists
aws configure list --profile employee-ideas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS profile 'employee-ideas' not found
    echo Please run: scripts\setup-aws-profile.bat
    exit /b 1
)

echo Starting deployment...
echo.

REM Step 1: Deploy Infrastructure
echo Step 1/3: Deploying Infrastructure...
call scripts\deploy-infrastructure.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Infrastructure deployment failed
    exit /b 1
)

echo.
echo Waiting 30 seconds for resources to stabilize...
timeout /t 30 /nobreak >nul
echo.

REM Step 2: Deploy Backend
echo Step 2/3: Deploying Backend...
call scripts\deploy-backend.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend deployment failed
    exit /b 1
)

echo.

REM Step 3: Deploy Frontend
echo Step 3/3: Deploying Frontend...
call scripts\deploy-frontend.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend deployment failed
    exit /b 1
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Access your application using the Website URL above
echo 2. Create an admin user: scripts\create-admin-user.bat
echo 3. Review CloudWatch logs for any issues
echo.
pause
