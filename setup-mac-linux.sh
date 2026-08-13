#!/bin/bash

# VTS Phone Agent - Auto-setup for GitHub & Railway
# Just run this script and follow the prompts

echo ""
echo "========================================"
echo "VTS Marine AI Phone Agent - Auto Setup"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "ERROR: Git not installed. Install with:"
    echo "  Mac: brew install git"
    echo "  Linux: sudo apt install git"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USER

# Get GitHub repo name
read -p "Enter repo name (default: vts-phone-agent): " REPO_NAME
REPO_NAME=${REPO_NAME:-vts-phone-agent}

# Create folder
echo ""
echo "Creating folder: $REPO_NAME"
mkdir -p "$REPO_NAME"
cd "$REPO_NAME"

# Initialize git
echo "Initializing git..."
git init
git branch -M main

# Add all files
echo "Adding files..."
git add .

# Commit
echo "Committing..."
git commit -m "Initial VTS Phone Agent setup"

# Add remote
echo "Adding GitHub remote..."
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Push
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "========================================"
echo "SUCCESS! Your repo is on GitHub."
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Login with GitHub"
echo "3. New Project -> Deploy from GitHub"
echo "4. Select $REPO_NAME"
echo "5. Add environment variables"
echo "6. Get your public URL"
echo "========================================"
echo ""
