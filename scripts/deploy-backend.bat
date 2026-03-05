@echo off
REM Deploy Backend Lambda Functions (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set STACK_NAME=employee-ideas-stack

echo ==========================================
echo Deploying Backend Lambda Functions
echo ==========================================
echo.

REM Get Lambda function names from CloudFormation stack
echo Getting Lambda function names from stack...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='UserServiceFunctionName'].OutputValue" --output text') do set USER_SERVICE_FUNCTION=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --profile %PROFILE% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='IdeasServiceFunctionName'].OutputValue" --output text') do set IDEAS_SERVICE_FUNCTION=%%i

echo User Service Function: %USER_SERVICE_FUNCTION%
echo Ideas Service Function: %IDEAS_SERVICE_FUNCTION%
echo.

REM Build and deploy User Service
echo Building User Service...
cd backend\user-service
call npm install --production
call npm run build

echo Creating deployment package for User Service...
if exist dist rmdir /s /q dist
mkdir dist
xcopy /s /q node_modules dist\node_modules\
xcopy /s /q build\* dist\
cd dist
powershell -command "Compress-Archive -Path * -DestinationPath ..\user-service.zip -Force"
cd ..

echo Deploying User Service to Lambda...
aws lambda update-function-code ^
  --function-name %USER_SERVICE_FUNCTION% ^
  --zip-file fileb://user-service.zip ^
  --profile %PROFILE% ^
  --region %REGION%

echo [OK] User Service deployed
echo.

REM Build and deploy Ideas Service
echo Building Ideas Service...
cd ..\ideas-service
call npm install --production
call npm run build

echo Creating deployment package for Ideas Service...
if exist dist rmdir /s /q dist
mkdir dist
xcopy /s /q node_modules dist\node_modules\
xcopy /s /q build\* dist\
cd dist
powershell -command "Compress-Archive -Path * -DestinationPath ..\ideas-service.zip -Force"
cd ..

echo Deploying Ideas Service to Lambda...
aws lambda update-function-code ^
  --function-name %IDEAS_SERVICE_FUNCTION% ^
  --zip-file fileb://ideas-service.zip ^
  --profile %PROFILE% ^
  --region %REGION%

echo [OK] Ideas Service deployed
echo.

cd ..\..

echo ==========================================
echo Backend deployment complete!
echo ==========================================
