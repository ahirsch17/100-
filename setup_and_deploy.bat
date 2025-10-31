@echo off
echo ========================================
echo  100%% Workout App - Setup and Deploy
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo Step 1: Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo Step 2: Initializing Git repository...
if exist .git (
    echo Git repository already exists.
) else (
    git init
    echo Git repository initialized.
)
echo.

echo Step 3: Adding all files to Git...
git add .
echo Files added.
echo.

echo Step 4: Creating commit...
git commit -m "Initial commit: 100%% workout tracking app"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Commit may have failed or no changes detected.
)
echo.

echo Step 5: Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/ahirsch17/100-.git
echo Remote repository configured.
echo.

echo Step 6: Setting branch to main...
git branch -M main
echo.

echo Step 7: Pushing to GitHub...
echo (This may require authentication)
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Code pushed to GitHub!
    echo  Repository: https://github.com/ahirsch17/100-
    echo ========================================
) else (
    echo.
    echo ========================================
    echo  Push may have failed. Common issues:
    echo  1. Need to authenticate with GitHub
    echo  2. Repository permissions
    echo  3. Network connection
    echo.
    echo  You can try running these commands manually:
    echo    git push -u origin main
    echo ========================================
)

echo.
pause

