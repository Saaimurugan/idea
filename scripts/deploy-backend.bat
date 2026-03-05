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
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed for User Service
    cd ..\..
    exit /b 1
)

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed for User Service
    cd ..\..
    exit /b 1
)

echo Creating deployment package for User Service...
if exist dist rmdir /s /q dist
if exist user-service.zip del user-service.zip

REM Create temporary directory for packaging
mkdir dist

REM Copy built files first
echo Copying built files...
xcopy /s /q build\* dist\

REM Copy package files for production install
echo Installing production dependencies...
copy package.json dist\package.json
copy package-lock.json dist\package-lock.json 2>nul

REM Install production dependencies in dist
pushd dist
call npm install --production --no-package-lock
popd

REM Create zip file
echo Creating zip package...
pushd dist
powershell -command "Compress-Archive -Path * -DestinationPath ..\user-service.zip -Force"
popd

echo Deploying User Service to Lambda...
aws lambda update-function-code ^
  --function-name %USER_SERVICE_FUNCTION% ^
  --zip-file fileb://user-service.zip ^
  --profile %PROFILE% ^
  --region %REGION%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to deploy User Service to Lambda
    cd ..\..
    exit /b 1
)

echo [OK] User Service deployed
echo.

REM Build and deploy Ideas Service
echo Building Ideas Service...
cd ..\ideas-service
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed for Ideas Service
    cd ..\..
    exit /b 1
)

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed for Ideas Service
    cd ..\..
    exit /b 1
)

echo Creating deployment package for Ideas Service...
if exist dist rmdir /s /q dist
if exist ideas-service.zip del ideas-service.zip

REM Create temporary directory for packaging
mkdir dist

REM Copy built files first
echo Copying built files...
xcopy /s /q build\* dist\

REM Copy package files for production install
echo Installing production dependencies...
copy package.json dist\package.json
copy package-lock.json dist\package-lock.json 2>nul

REM Install production dependencies in dist
pushd dist
call npm install --production --no-package-lock
popd

REM Create zip file
echo Creating zip package...
pushd dist
powershell -command "Compress-Archive -Path * -DestinationPath ..\ideas-service.zip -Force"
popd

echo Deploying Ideas Service to Lambda...
aws lambda update-function-code ^
  --function-name %IDEAS_SERVICE_FUNCTION% ^
  --zip-file fileb://ideas-service.zip ^
  --profile %PROFILE% ^
  --region %REGION%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to deploy Ideas Service to Lambda
    cd ..\..
    exit /b 1
)

echo [OK] Ideas Service deployed
echo.

cd ..\..

echo ==========================================
echo Backend deployment complete!
echo ==========================================
