@echo off
REM Deploy Frontend to S3 (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set STACK_NAME=employee-ideas-stack

echo ==========================================
echo Deploying Frontend to S3
echo ==========================================
echo.

REM Get S3 bucket name and API Gateway URL from CloudFormation stack
echo Getting deployment information from stack...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text') do set S3_BUCKET=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text') do set API_URL=%%i

echo S3 Bucket: %S3_BUCKET%
echo API Gateway URL: %API_URL%
echo.

REM Create .env file for frontend build
echo Creating frontend environment configuration...
cd frontend
echo VITE_API_BASE_URL=%API_URL%> .env.production

echo [OK] Environment configuration created
echo.

REM Build frontend
echo Building frontend...
call npm install
call npm run build

echo [OK] Frontend build complete
echo.

REM Deploy to S3
echo Deploying to S3...
aws s3 sync dist/ s3://%S3_BUCKET%/ ^
  --profile %PROFILE% ^
  --region %REGION% ^
  --delete ^
  --cache-control "public, max-age=31536000" ^
  --exclude "index.html"

REM Upload index.html with no-cache
aws s3 cp dist/index.html s3://%S3_BUCKET%/index.html ^
  --profile %PROFILE% ^
  --region %REGION% ^
  --cache-control "no-cache"

echo [OK] Files uploaded to S3
echo.

cd ..

REM Get website URL
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" --output text') do set WEBSITE_URL=%%i

echo ==========================================
echo Frontend deployment complete!
echo ==========================================
echo.
echo Website URL: %WEBSITE_URL%
echo.
