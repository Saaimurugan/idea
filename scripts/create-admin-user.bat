@echo off
REM Create an admin user in DynamoDB (Windows)

setlocal

set AWS_PROFILE=employee-ideas
set AWS_REGION=us-east-2
set ENVIRONMENT=prod

echo Running admin user creation script...
echo.

REM Run the Node.js script
node scripts\create-admin-user.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create admin user
    pause
    exit /b 1
)

echo.
pause
