# Deploy to Railway (5 minutes)

## Step 1: GitHub Setup (2 min)

```bash
# Create a new folder
mkdir vts-phone-agent
cd vts-phone-agent

# Initialize git
git init
git branch -M main

# Copy these files into the folder:
# - phone-agent-backend.js
# - package.json
# - .env.railway (rename to .env for local testing)
# - QUICKSTART.md
# - SETUP.md
```

### Create `.env.local` (for local testing)
```env
TWILIO_ACCOUNT_SID=AC7b1113ca7d350d8baf0859faa96b96c2
TWILIO_AUTH_TOKEN=b1835c7696eb9077d4f7c94726e52e11
TWILIO_PHONE_1=+16043518525
TWILIO_PHONE_2=+17785486246
OPERATOR_PHONE=+16043518525
ANTHROPIC_API_KEY=sk-ant-YOUR-NEW-KEY-HERE
PORT=3000
NODE_ENV=development
```

### Push to GitHub
```bash
# Stage all files
git add .

# Commit
git commit -m "Initial phone agent setup"

# Add remote (replace YOUR-USERNAME and YOUR-REPO)
git remote add origin https://github.com/YOUR-USERNAME/vts-phone-agent.git
git push -u origin main
```

---

## Step 2: Connect to Railway (2 min)

1. Go to **[railway.app](https://railway.app)**
2. Click **"Login with GitHub"** (sign up if needed)
3. Authorize Railway to access your GitHub
4. Click **"New Project"**
5. Select **"Deploy from GitHub repo"**
6. Find and select **`vts-phone-agent`**
7. Railway auto-detects Node.js

---

## Step 3: Add Environment Variables (1 min)

In Railway dashboard for your project:

1. Click **"Variables"** tab
2. Click **"Add Variable"**
3. Add these one by one:

| Key | Value |
|-----|-------|
| `TWILIO_ACCOUNT_SID` | `AC7b1113ca7d350d8baf0859faa96b96c2` |
| `TWILIO_AUTH_TOKEN` | `b1835c7696eb9077d4f7c94726e52e11` |
| `TWILIO_PHONE_1` | `+16043518525` |
| `TWILIO_PHONE_2` | `+17785486246` |
| `OPERATOR_PHONE` | `+16043518525` |
| `ANTHROPIC_API_KEY` | `sk-ant-YOUR-NEW-KEY-HERE` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

---

## Step 4: Deploy

1. Railway auto-deploys when you push to GitHub
2. Wait for **"Deployment Status: Success"** (usually 1-2 min)
3. Copy your **Public URL** (looks like: `https://vts-phone-agent-prod-xxxx.railway.app`)

---

## Step 5: Configure Twilio Webhooks

Now that you have your public URL, add it to Twilio:

### In Twilio Dashboard:
1. Go to **Phone Numbers → Manage Active Numbers**
2. Click on **6043518525** (first number)
3. Under **Voice Configuration**:
   - **When a call comes in**: 
        - URL: `https://your-railway-url.railway.app/call/incoming`
             - POST
                - **Fallback URL**:
                     - URL: `https://your-railway-url.railway.app/call/ended`
                          - POST
                          4. **Save**
                          5. Repeat for **7785486246** (second number)

                          ---

                          ## Step 6: Test It!

                          1. **Start the dashboard** (local React app on your machine):
                             ```bash
                                cd vts-phone-dashboard
                                   npm start
                                      ```

                                      2. **Call one of your Twilio numbers** from any phone
                                      3. Watch it appear on your dashboard
                                      4. Click **"Take Call"** or **"Route to AI"**
                                      5. Done!

                                      ---

                                      ## Check Logs

                                      If something breaks:

                                      ```bash
                                      # In Railway dashboard:
                                      1. Click your project
                                      2. Click "Deployments" tab
                                      3. Click latest deployment
                                      4. Scroll to "Logs" section
                                      5. Look for errors
                                      ```

                                      ---

                                      ## Common Issues

                                      | Problem | Solution |
                                      |---------|----------|
                                      | Deployment failed | Check logs for errors, ensure all env vars set |
                                      | Webhook timeout | Verify Railway URL is correct in Twilio |
                                      | No calls showing up | Check Twilio webhook URLs are correct |
                                      | AI not responding | Verify ANTHROPIC_API_KEY is correct |

                                      ---

                                      ## Next: Deploy Dashboard

                                      Once backend is live, deploy the React dashboard too:

                                      1. Create new GitHub repo: `vts-phone-dashboard`
                                      2. Add dashboard files
                                      3. Create `.env`:
                                         ```env
                                            REACT_APP_API_URL=https://your-railway-url.railway.app
                                               REACT_APP_WS_URL=wss://your-railway-url.railway.app
                                                  ```
                                                  4. Push to GitHub
                                                  5. In Railway: New Project → Deploy from GitHub
                                                  6. Railway gives you a URL for the dashboard

                                                  ---

                                                  You're live!
