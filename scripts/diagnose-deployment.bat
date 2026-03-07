@echo off
REM Diagnostic script to check deployment status

setlocal

set PROFILE=employee-ideas
set REGION=us-east-2
set API_ID=5ctqosryp2

echo ==========================================
echo Deployment Diagnostics
echo ==========================================
echo.

echo 1. Checking Lambda Functions...
echo ==========================================
echo.

echo User Service Function:
aws lambda get-function --function-name prod-UserService --profile %PROFILE% --region %REGION% --query "Configuration.[CodeSize,LastModified,Runtime]" --output table

echo.
echo Ideas Service Function:
aws lambda get-function --function-name prod-IdeasService --profile %PROFILE% --region %REGION% --query "Configuration.[CodeSize,LastModified,Runtime]" --output table

echo.
echo.
echo 2. Checking API Gateway Routes...
echo ==========================================
aws apigatewayv2 get-routes --api-id %API_ID% --profile %PROFILE% --region %REGION% --query "Items[*].[RouteKey,Target]" --output table

echo.
echo.
echo 3. Checking Recent Lambda Logs (User Service)...
echo ==========================================
aws logs tail /aws/lambda/prod-UserService --since 5m --profile %PROFILE% --region %REGION% 2>nul || echo No recent logs found

echo.
echo.
echo 4. Checking Recent Lambda Logs (Ideas Service)...
echo ==========================================
aws logs tail /aws/lambda/prod-IdeasService --since 5m --profile %PROFILE% --region %REGION% 2>nul || echo No recent logs found or log group does not exist

echo.
echo.
echo 5. Testing API Endpoints...
echo ==========================================
echo Testing User Service (should return 401 Unauthorized):
curl -s https://%API_ID%.execute-api.%REGION%.amazonaws.com/prod/users

echo.
echo.
echo Testing Ideas Service (should return 401 Unauthorized):
curl -s https://%API_ID%.execute-api.%REGION%.amazonaws.com/prod/ideas

echo.
echo.
echo ==========================================
echo Diagnostics Complete
echo ==========================================
pause
