# Deploy to Railway (5 minutes)

## Step 1: GitHub Setup (2 min)

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

### Create .env.local (for local testing)
### IMPORTANT: Never commit real secrets to GitHub. Use placeholders below and fill in your real values only in your local .env file (which should be gitignored) or in the Railway dashboard.

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_1=+1XXXXXXXXXX
TWILIO_PHONE_2=+1XXXXXXXXXX
OPERATOR_PHONE=+1XXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-your-new-key-here
PORT=3000
NODE_ENV=development

### Push to GitHub

# Stage all files
git add .

# Commit
git commit -m "Initial phone agent setup"

# Add remote (replace YOUR-USERNAME and YOUR-REPO)
git remote add origin https://github.com/YOUR-USERNAME/vts-phone-agent.git
git push -u origin main

---

## Step 2: Connect to Railway (2 min)

1. Go to railway.app
2. 2. Click "Login with GitHub" (sign up if needed)
   3. 3. Authorize Railway to access your GitHub
      4. 4. Click "New Project"
         5. 5. Select "Deploy from GitHub repo"
            6. 6. Find and select vts-phone-agent
               7. 7. Railway auto-detects Node.js
                 
                  8. ---
                 
                  9. ## Step 3: Add Environment Variables (1 min)
                 
                  10. In Railway dashboard for your project:
                 
                  11. 1. Click "Variables" tab
                      2. 2. Click "Add Variable"
                         3. 3. Add these one by one, using YOUR real values (get them from your Twilio console and Anthropic console - never paste real secrets into files committed to GitHub):
                           
                            4. | Key | Value |
                            5. |-----|-------|
                            6. | TWILIO_ACCOUNT_SID | your Twilio Account SID |
                            7. | TWILIO_AUTH_TOKEN | your Twilio Auth Token |
                            8. | TWILIO_PHONE_1 | your first Twilio phone number |
                            9. | TWILIO_PHONE_2 | your second Twilio phone number |
                            10. | OPERATOR_PHONE | your operator phone number |
                            11. | ANTHROPIC_API_KEY | your Anthropic API key |
                            12. | PORT | 3000 |
                            13. | NODE_ENV | production |
                           
                            14. ---
                           
                            15. ## Step 4: Deploy
                           
                            16. 1. Railway auto-deploys when you push to GitHub
                                2. 2. Wait for "Deployment Status: Success" (usually 1-2 min)
                                   3. 3. Copy your Public URL (looks like: https://vts-phone-agent-prod-xxxx.railway.app)
                                     
                                      4. ---
                                     
                                      5. ## Step 5: Configure Twilio Webhooks
                                     
                                      6. Now that you have your public URL, add it to Twilio:
                                     
                                      7. ### In Twilio Dashboard:
                                      8. 1. Go to Phone Numbers -> Manage Active Numbers
                                         2. 2. Click on your first number
                                            3. 3. Under Voice Configuration:
                                               4. - When a call comes in:
                                                  - - URL: https://your-railway-url.railway.app/call/incoming
                                                    - - POST
                                                      - - Fallback URL:
                                                        - - URL: https://your-railway-url.railway.app/call/ended
                                                          - - POST
                                                            - 4. Save
                                                              5. 5. Repeat for your second number
                                                                
                                                                 6. ---
                                                                
                                                                 7. ## Step 6: Test It!
                                                                
                                                                 8. 1. Start the dashboard (local React app on your machine):
                                                                    2. cd vts-phone-dashboard
                                                                    3. npm start
                                                                   
                                                                    4. 2. Call one of your Twilio numbers from any phone
                                                                       3. 3. Watch it appear on your dashboard
                                                                          4. 4. Click "Take Call" or "Route to AI"
                                                                             5. 5. Done!
                                                                               
                                                                                6. ---
                                                                               
                                                                                7. ## Check Logs
                                                                               
                                                                                8. If something breaks:
                                                                               
                                                                                9. # In Railway dashboard:
                                                                                10. 1. Click your project
                                                                                    2. 2. Click "Deployments" tab
                                                                                       3. 3. Click latest deployment
                                                                                          4. 4. Scroll to "Logs" section
                                                                                             5. 5. Look for errors
                                                                                               
                                                                                                6. ---
                                                                                               
                                                                                                7. ## Common Issues
                                                                                               
                                                                                                8. | Problem | Solution |
                                                                                                9. |---------|----------|
                                                                                                10. | Deployment failed | Check logs for errors, ensure all env vars set |
                                                                                                11. | Webhook timeout | Verify Railway URL is correct in Twilio |
                                                                                                12. | No calls showing up | Check Twilio webhook URLs are correct |
                                                                                                13. | AI not responding | Verify ANTHROPIC_API_KEY is correct |
                                                                                               
                                                                                                14. ---
                                                                                               
                                                                                                15. ## Next: Deploy Dashboard
                                                                                               
                                                                                                16. Once backend is live, deploy the React dashboard too:
                                                                                               
                                                                                                17. 1. Create new GitHub repo: vts-phone-dashboard
                                                                                                    2. 2. Add dashboard files
                                                                                                       3. 3. Create .env:
                                                                                                          4. REACT_APP_API_URL=https://your-railway-url.railway.app
                                                                                                          5. REACT_APP_WS_URL=wss://your-railway-url.railway.app
                                                                                                         
                                                                                                          6. 4. Push to GitHub
                                                                                                             5. 5. In Railway: New Project -> Deploy from GitHub
                                                                                                                6. 6. Railway gives you a URL for the dashboard
                                                                                                                  
                                                                                                                   7. ---
                                                                                                                  
                                                                                                                   8. You're live!
                                                                                                                   9. 
