# Quick Setup and Deploy

## Option 1: Automated Script (Easiest)

**Double-click `setup_and_deploy.bat`** in the `hundred` folder. It will:
1. Install npm dependencies
2. Initialize git
3. Commit all files
4. Push to GitHub

## Option 2: Manual Steps

Open PowerShell or Command Prompt in the `hundred` directory:

```powershell
# 1. Install dependencies
npm install

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. Create commit
git commit -m "Initial commit: 100% workout tracking app"

# 5. Add remote repository
git remote add origin https://github.com/ahirsch17/100-.git

# 6. Set branch to main
git branch -M main

# 7. Push to GitHub
git push -u origin main
```

If you get authentication errors, you may need to:
- Set up a Personal Access Token
- Or use GitHub Desktop
- Or authenticate via the GitHub CLI

