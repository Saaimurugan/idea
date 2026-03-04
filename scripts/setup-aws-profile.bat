@echo off
REM Setup AWS CLI Profile for Employee Ideas Management System (Windows)

echo ==========================================
echo AWS Profile Setup
echo ==========================================
echo.
echo This will configure an AWS CLI profile named 'employee-ideas'
echo Your credentials will be stored securely in %%USERPROFILE%%\.aws\credentials
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not installed
    echo Please install it first: https://aws.amazon.com/cli/
    exit /b 1
)

echo Configuring AWS profile 'employee-ideas'...
echo.

REM Configure the profile
aws configure --profile employee-ideas

echo.
echo ==========================================
echo Profile configured successfully!
echo ==========================================
echo.
echo To verify your configuration:
echo   aws sts get-caller-identity --profile employee-ideas
echo.
echo Your credentials are stored in: %%USERPROFILE%%\.aws\credentials
echo Your config is stored in: %%USERPROFILE%%\.aws\config
echo.
pause
