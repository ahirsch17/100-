@echo off
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo npm install failed!
    pause
    exit /b 1
)

echo.
echo Initializing git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: 100%% workout tracking app"

echo.
echo Setting up remote repository...
git remote add origin https://github.com/ahirsch17/100-.git 2>nul || git remote set-url origin https://github.com/ahirsch17/100-.git

echo.
echo Setting branch to main...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Push failed. If the repository is empty, you may need to:
    echo 1. Go to https://github.com/ahirsch17/100-
    echo 2. Make sure the repository exists and is empty
    echo 3. Try running this script again
    pause
    exit /b 1
)

echo.
echo Done! Your code has been pushed to GitHub.
pause

