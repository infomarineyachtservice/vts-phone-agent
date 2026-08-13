# VTS Marine AI Phone Agent - Quick Start (15 mins)

## What You're Getting
A **live phone system** where:
- Call comes in on your two numbers
- Dashboard shows them instantly
- You click to take the call OR let AI handle it
- AI books services, takes parts orders, answers questions
- Everything logged automatically

---

## Super Quick Setup

### 1. Get Twilio (2 min)
```
→ twilio.com → Sign up (free)
→ Copy Account SID & Auth Token
→ Link your two numbers (add webhooks later)
```

### 2. Setup Backend (3 min)
```bash
npm install express twilio @anthropic-ai/sdk cors sqlite3 ws dotenv
cp .env.example .env
# Edit .env with your credentials
node phone-agent-backend.js
```

### 3. Setup Dashboard (5 min)
```bash
npx create-react-app vts-phone-dashboard
cd vts-phone-dashboard
# Copy phone-agent-dashboard.jsx → src/App.jsx
# Copy Dashboard.css → src/App.css
npm start
```

### 4. Add Twilio Webhooks (2 min)
In Twilio → Phone Numbers → Your Number:
```
Webhook URL: https://your-backend-url.com/call/incoming
POST

Fallback: https://your-backend-url.com/call/ended
```

### 5. Test
Call your number → See it appear in dashboard → Click "Take" or "Route to AI"

---

## Files Included

| File | Purpose |
|------|---------|
| `phone-agent-backend.js` | Node.js server (Twilio + Claude) |
| `phone-agent-dashboard.jsx` | React dashboard (your control panel) |
| `Dashboard.css` | Dashboard styling |
| `package.json` | Dependencies |
| `.env.example` | Template for secrets |
| `SETUP.md` | Full detailed setup |
| `QUICKSTART.md` | This file |

---

## Key Features

✅ **Real-time call display** - See calls instantly
✅ **One-click routing** - Take it or let AI handle it
✅ **Smart AI** - Claude handles bookings, orders, questions
✅ **Auto-logging** - All conversations saved
✅ **Mobile-friendly** - Dashboard works on phone/tablet
✅ **Message history** - Review past calls anytime

---

## Customization (Easy)

### Change AI Behavior
Edit `systemPrompt` in `phone-agent-backend.js`:
```javascript
const systemPrompt = `You are... 
- Handle bookings for [your services]
- Take orders for [your products]
- Answer questions about [topics]
...`
```

### Add Your Service Details
Update the prompt to mention:
- Your service types
- Parts/products you offer
- Repair types you handle
- Booking hours/availability

### Log to Email/CRM
Add a webhook after AI responds:
```javascript
// Send to Airtable, Salesforce, email, etc.
await sendToYourCRM(callData);
```

---

## Testing Without Twilio
**Use ngrok for local testing:**
```bash
# Terminal 1
node phone-agent-backend.js

# Terminal 2
ngrok http 3000
# Use ngrok URL in Twilio webhooks
```

---

## Deployment Options

| Option | Cost | Setup Time | Ease |
|--------|------|-----------|------|
| **Heroku** | Free (limited) | 5 min | ⭐⭐⭐ |
| **Railway** | $5-10/mo | 5 min | ⭐⭐⭐⭐ |
| **AWS EC2** | $5-30/mo | 30 min | ⭐⭐ |
| **Your VPS** | Varies | 15 min | ⭐⭐ |

**Recommended: Railway** (GitHub push, auto-deploy, cheap)

---

## What Happens on a Call

```
1. Person calls → Twilio routes to /call/incoming
2. TwiML plays: "Press 1 for agent, or wait for assistant"
3. Dashboard shows incoming call
4. You click "Take" or "Route to AI"
   ↓
      IF YOU TAKE IT:
           → Call redirects to your phone
                → You talk to them
                   ↓
                      IF AI TAKES IT:
                           → Claude answers with: "Hi, what can I help with?"
                                → Customer speaks
                                     → Speech-to-text → Claude → Text-to-speech
                                          → Conversation continues until customer hangs up
                                               → All logged in dashboard
                                               ```

                                               ---

                                               ## Cost Estimate (Monthly)

                                               | Service | Cost |
                                               |---------|------|
                                               | Twilio (incoming calls) | ~$2-10 |
                                               | Twilio (outgoing to you) | ~$1-5 |
                                               | Claude API (calls/messages) | ~$5-20 |
                                               | Hosting (Railway/Heroku) | $0-10 |
                                               | **Total** | **~$10-50/mo** |

                                               (Depends on call volume)

                                               ---

                                               ## Next Steps

                                               1. **Read SETUP.md** for detailed instructions
                                               2. **Get Twilio credentials**
                                               3. **Deploy backend** (Railway or local with ngrok)
                                               4. **Setup dashboard**
                                               5. **Make test call**
                                               6. **Customize AI prompt** for your business
                                               7. **Integrate with CRM** (optional)

                                               ---

                                               ## Troubleshooting

                                               **"Webhook failed"**
                                               → Backend not running or URL is wrong

                                               **"AI not responding"**
                                               → Check ANTHROPIC_API_KEY, Claude API credits

                                               **"Dashboard not showing calls"**
                                               → WebSocket connection issue, check browser console

                                               **"Twilio charges me random amounts"**
                                               → Upgrade from trial to standard account, add payment method

                                               ---

                                               ## Questions?

                                               Check the full SETUP.md for:
                                               - Detailed Twilio config
                                               - Deployment guides
                                               - API endpoints
                                               - Troubleshooting

                                               You're ready to go!
