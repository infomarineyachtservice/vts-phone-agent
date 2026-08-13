const express = require('express');
const twilio = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const WebSocket = require('ws');

require('dotenv').config();

const app = express();

// Check env vars on startup
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_1',
  'TWILIO_PHONE_2',
  'OPERATOR_PHONE',
  'ANTHROPIC_API_KEY'
];

let isConfigured = true;
const missingVars = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    isConfigured = false;
    missingVars.push(varName);
  }
}

// Initialize clients only if configured
let twilioClient = null;
let client = null;

if (isConfigured) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log('✅ All environment variables configured');
} else {
  console.warn('⚠️  Missing environment variables:', missingVars);
  console.warn('Server will start but webhooks will not process calls.');
  console.warn('Add these variables in Railway dashboard and restart.');
}

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_1 = process.env.TWILIO_PHONE_1 || '+16043518525';
const TWILIO_PHONE_2 = process.env.TWILIO_PHONE_2 || '+17785486246';
const OPERATOR_PHONE = process.env.OPERATOR_PHONE || '+16043518525';

// SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      from_number TEXT,
      to_number TEXT,
      status TEXT,
      handled_by TEXT,
      transcript TEXT,
      created_at DATETIME,
      ended_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      call_id TEXT,
      role TEXT,
      content TEXT,
      created_at DATETIME,
      FOREIGN KEY(call_id) REFERENCES calls(id)
    )
  `);
});

// WebSocket for real-time updates
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connections = new Set();

wss.on('connection', (ws) => {
  console.log('Dashboard connected');
  
  // Send current config status
  ws.send(JSON.stringify({
    type: 'config_status',
    isConfigured: isConfigured,
    missingVars: missingVars
  }));

  connections.add(ws);

  ws.on('close', () => {
    connections.delete(ws);
  });
});

const broadcast = (data) => {
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
};

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    isConfigured: isConfigured,
    missingVars: missingVars
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    isConfigured: isConfigured,
    missingVars: missingVars,
    message: isConfigured 
      ? 'Ready for calls' 
      : `Missing: ${missingVars.join(', ')}`
  });
});

// Incoming call webhook from Twilio
app.post('/call/incoming', (req, res) => {
  if (!isConfigured) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('System is not configured. Please add environment variables.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;

  console.log(`Incoming call: ${from} -> ${to}`);

  // Store call in DB
  db.run(
    'INSERT INTO calls (id, from_number, to_number, status, handled_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [callSid, from, to, 'incoming', 'pending', new Date().toISOString()]
  );

  // Notify dashboard
  broadcast({
    type: 'incoming_call',
    call_id: callSid,
    from,
    to,
    timestamp: new Date().toISOString(),
  });

  // Start gathering input
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.gather({
    numDigits: 1,
    action: `/call/route?CallSid=${callSid}&From=${from}`,
    method: 'POST',
  }).say('Press 1 to connect with support, or wait for automated assistance.');

  res.type('text/xml');
  res.send(twiml.toString());
});

// Call routing endpoint
app.post('/call/route', (req, res) => {
  if (!isConfigured) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('System is not configured.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const { CallSid, From } = req.query;
  const digits = req.body.Digits;

  const twiml = new twilio.twiml.VoiceResponse();

  if (digits === '1') {
    // Operator pressed 1 - route to human
    broadcast({
      type: 'call_routed',
      call_id: CallSid,
      routed_to: 'human',
      timestamp: new Date().toISOString(),
    });

    db.run('UPDATE calls SET handled_by = ? WHERE id = ?', ['human', CallSid]);

    twiml.say('Connecting you to an agent.');
    twiml.dial(OPERATOR_PHONE, { timeout: 30 });
  } else {
    // No input or timeout - route to AI
    broadcast({
      type: 'call_routed',
      call_id: CallSid,
      routed_to: 'ai',
      timestamp: new Date().toISOString(),
    });

    db.run('UPDATE calls SET handled_by = ? WHERE id = ?', ['ai', CallSid]);

    twiml.say('Connecting you to our service assistant.');
    twiml.redirect(`/call/ai?CallSid=${CallSid}&From=${From}`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// AI conversation endpoint
app.post('/call/ai', async (req, res) => {
  if (!isConfigured) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('System is not configured.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const { CallSid, From } = req.query;
  const speechResult = req.body.SpeechResult || '';

  console.log(`AI Input (${CallSid}): ${speechResult}`);

  try {
    // Get call history
    const messages = await new Promise((resolve) => {
      db.all(
        'SELECT role, content FROM messages WHERE call_id = ? ORDER BY created_at',
        [CallSid],
        (err, rows) => resolve(rows || [])
      );
    });

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for VTS Marine Yacht Service. You handle:
- Service bookings (maintenance, repairs, detailing)
- Parts orders (marine equipment, supplies)
- Repair help & troubleshooting (answer technical questions)
- General customer support

Keep responses SHORT (1-2 sentences max) and conversational. Ask clarifying questions if needed.
When booking: get name, email, phone, date/time preference.
When ordering parts: get part name, quantity, delivery address.
When giving advice: be helpful and clear.

If the customer asks something outside your scope, offer to transfer them to a human agent.`;

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: speechResult || 'Hello' },
      ],
    });

    const aiResponse = response.content[0].text;

    // Store messages
    const now = new Date().toISOString();
    db.run('INSERT INTO messages (id, call_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', [
      `msg_user_${Date.now()}`,
      CallSid,
      'user',
      speechResult,
      now,
    ]);

    db.run('INSERT INTO messages (id, call_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', [
      `msg_ai_${Date.now()}`,
      CallSid,
      'assistant',
      aiResponse,
      now,
    ]);

    // Broadcast to dashboard
    broadcast({
      type: 'ai_message',
      call_id: CallSid,
      from: 'ai',
      content: aiResponse,
      timestamp: now,
    });

    // Respond with TwiML
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(aiResponse);
    twiml.gather({
      numDigits: 1,
      action: `/call/ai?CallSid=${CallSid}&From=${From}`,
      method: 'POST',
      timeout: 5,
    }).say('You can continue, or press 1 to end the call.');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('AI Error:', err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an issue. Transferring you to an agent.');
    twiml.dial(OPERATOR_PHONE);
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Call ended webhook
app.post('/call/ended', (req, res) => {
  const callSid = req.body.CallSid;
  console.log(`Call ended: ${callSid}`);

  db.run(
    'UPDATE calls SET status = ?, ended_at = ? WHERE id = ?',
    ['ended', new Date().toISOString(), callSid]
  );

  broadcast({
    type: 'call_ended',
    call_id: callSid,
    timestamp: new Date().toISOString(),
  });

  res.send('OK');
});

// API: Get all calls
app.get('/api/calls', (req, res) => {
  db.all('SELECT * FROM calls ORDER BY created_at DESC', (err, rows) => {
    res.json(rows || []);
  });
});

// API: Get call details with messages
app.get('/api/calls/:id', (req, res) => {
  const callId = req.params.id;

  db.get('SELECT * FROM calls WHERE id = ?', [callId], (err, call) => {
    db.all(
      'SELECT * FROM messages WHERE call_id = ? ORDER BY created_at',
      [callId],
      (err, messages) => {
        res.json({ call, messages });
      }
    );
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Phone Agent Backend running on port ${PORT}`);
  if (isConfigured) {
    console.log('✅ Ready to receive calls');
  } else {
    console.log('⚠️  Add environment variables in Railway dashboard to enable calls');
  }
});
