@echo off
REM Deploy Infrastructure using CloudFormation (Windows)

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set STACK_NAME=employee-ideas-stack
set TEMPLATE_FILE=infrastructure/cloudformation.yaml

echo ==========================================
echo Deploying Infrastructure to AWS
echo ==========================================
echo Profile: %PROFILE%
echo Region: %REGION%
echo Stack: %STACK_NAME%
echo.

REM Validate CloudFormation template
echo Validating CloudFormation template...
aws cloudformation validate-template ^
  --template-body file://%TEMPLATE_FILE% ^
  --profile %PROFILE% ^
  --region %REGION%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Template validation failed
    exit /b 1
)

echo [OK] Template is valid
echo.

REM Deploy the stack
echo Deploying CloudFormation stack...
aws cloudformation deploy ^
  --template-file %TEMPLATE_FILE% ^
  --stack-name %STACK_NAME% ^
  --capabilities CAPABILITY_NAMED_IAM ^
  --profile %PROFILE% ^
  --region %REGION% ^
  --parameter-overrides Environment=prod

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Stack deployment failed
    exit /b 1
)

echo.
echo [OK] Stack deployment complete
echo.

REM Get stack outputs
echo ==========================================
echo Stack Outputs:
echo ==========================================
aws cloudformation describe-stacks ^
  --stack-name %STACK_NAME% ^
  --profile %PROFILE% ^
  --region %REGION% ^
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" ^
  --output table

echo.
echo Deployment complete!
