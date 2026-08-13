@echo off
REM VTS Phone Agent - Auto-setup for GitHub & Railway
REM Just run this script and follow the prompts

echo.
echo ========================================
echo VTS Marine AI Phone Agent - Auto Setup
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not installed. Download from https://git-scm.com
    pause
    exit /b 1
)

REM Get GitHub username
set /p GITHUB_USER="Enter your GitHub username: "

REM Get GitHub repo name
set /p REPO_NAME="Enter repo name (default: vts-phone-agent): "
if "%REPO_NAME%"=="" set REPO_NAME=vts-phone-agent

REM Create folder
echo.
echo Creating folder: %REPO_NAME%
mkdir %REPO_NAME%
cd %REPO_NAME%

REM Initialize git
echo Initializing git...
git init
git branch -M main

REM Add all files
echo Adding files...
git add .

REM Commit
echo Committing...
git commit -m "Initial VTS Phone Agent setup"

REM Add remote
echo Adding GitHub remote...
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

REM Push
echo Pushing to GitHub (you may be prompted for credentials)...
git push -u origin main

echo.
echo ========================================
echo SUCCESS! Your repo is on GitHub.
echo.
echo Next steps:
echo 1. Go to https://railway.app
echo 2. Login with GitHub
echo 3. New Project -> Deploy from GitHub
echo 4. Select %REPO_NAME%
echo 5. Add environment variables
echo 6. Get your public URL
echo ========================================
echo.
pause
