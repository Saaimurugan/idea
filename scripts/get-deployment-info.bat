@echo off
REM Get deployment information (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set STACK_NAME=employee-ideas-stack

echo ==========================================
echo Deployment Information
echo ==========================================
echo.

aws cloudformation describe-stacks ^
  --stack-name %STACK_NAME% ^
  --profile %PROFILE% ^
  --region %REGION% ^
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]" ^
  --output table

echo.
pause
