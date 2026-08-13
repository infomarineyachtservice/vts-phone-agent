# VTS Phone Agent - One-Click Setup

## Download Everything

1. **Scroll back up** in this chat
2. Download ALL these files:
   - `phone-agent-backend.js`
   - `package.json`
   - `.env.railway`
   - `setup-windows.bat` (if on Windows) OR `setup-mac-linux.sh` (if Mac/Linux)
   - `DEPLOY_RAILWAY.md`
   - `QUICKSTART.md`

3. **Create a folder** on your computer called `vts-phone-agent`

4. **Put all downloaded files into that folder**

---

## Run Setup Script

### **Windows:**
1. Open the `vts-phone-agent` folder
2. Right-click → "Open in Terminal" (or "Open PowerShell here")
3. Copy-paste this and press Enter:
   ```
   setup-windows.bat
   ```
4. Answer the prompts:
   - GitHub username: `your-github-username`
   - Repo name: `vts-phone-agent` (just press Enter)
5. Done! Your code is on GitHub

### **Mac/Linux:**
1. Open Terminal
2. Go to your folder:
   ```bash
   cd ~/vts-phone-agent
   ```
3. Make script executable:
   ```bash
   chmod +x setup-mac-linux.sh
   ```
4. Run it:
   ```bash
   ./setup-mac-linux.sh
   ```
5. Answer the prompts
6. Done!

---

## What the Script Does

✅ Initializes git
✅ Adds all your files
✅ Commits them
✅ Pushes to GitHub

You don't need to type any git commands. It's all automated.

---

## After Setup

Once the script finishes:

1. Go to **[railway.app](https://railway.app)**
2. Login with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Add environment variables (see DEPLOY_RAILWAY.md)
6. You're live!

---

**Questions?** Run the script, tell me what happens.
