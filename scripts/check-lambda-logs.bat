@echo off
REM Check Lambda function logs (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2

echo ==========================================
echo Lambda Function Logs
echo ==========================================
echo.

echo Checking User Service logs...
echo ==========================================
aws logs tail /aws/lambda/prod-UserService --since 10m --profile %PROFILE% --region %REGION%

echo.
echo.
echo Checking Ideas Service logs...
echo ==========================================
aws logs tail /aws/lambda/prod-IdeasService --since 10m --profile %PROFILE% --region %REGION%

echo.
pause
