@echo off
REM Cleanup - Delete all AWS resources (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set STACK_NAME=employee-ideas-stack

echo ==========================================
echo WARNING: This will delete all resources
echo ==========================================
echo.
set /p CONFIRM="Are you sure you want to delete everything? (yes/no): "

if not "%CONFIRM%"=="yes" (
    echo Cleanup cancelled
    exit /b 0
)

echo.
echo Getting S3 bucket name...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text 2^>nul') do set S3_BUCKET=%%i

if not "%S3_BUCKET%"=="" (
    echo Emptying S3 bucket: %S3_BUCKET%
    aws s3 rm s3://%S3_BUCKET%/ --recursive --profile %PROFILE% --region %REGION%
)

echo.
echo Deleting CloudFormation stack...
aws cloudformation delete-stack ^
  --stack-name %STACK_NAME% ^
  --profile %PROFILE% ^
  --region %REGION%

echo Waiting for stack deletion...
aws cloudformation wait stack-delete-complete ^
  --stack-name %STACK_NAME% ^
  --profile %PROFILE% ^
  --region %REGION%

echo.
echo [OK] All resources deleted
pause
