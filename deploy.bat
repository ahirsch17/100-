@echo off
cd /d "%~dp0"
git init
git add .
git commit -m "Initial commit: 100%% workout tracking app"
git remote add origin https://github.com/ahirsch17/100-.git 2>nul || git remote set-url origin https://github.com/ahirsch17/100-.git
git pull origin main --allow-unrelated-histories 2>nul || echo "No existing history to pull"
git branch -M main
git push -u origin main
pause

