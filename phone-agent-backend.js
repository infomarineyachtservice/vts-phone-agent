const express = require('express');
const twilio = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const WebSocket = require('ws');

require('dotenv').config();

const app = express();

// Check env vars
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_1',
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
}

const OPERATOR_PHONE = process.env.OPERATOR_PHONE || '+19387863205';

// SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      from_number TEXT,
      to_number TEXT,
      status TEXT,
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

// WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connections = new Set();

wss.on('connection', (ws) => {
  console.log('Dashboard connected');
  
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

app.get('/api/status', (req, res) => {
  res.json({
    isConfigured: isConfigured,
    missingVars: missingVars,
    message: isConfigured 
      ? 'Ready for calls' 
      : `Missing: ${missingVars.join(', ')}`
  });
});

// Incoming call - start conversation with AI directly
app.post('/call/incoming', (req, res) => {
  if (!isConfigured) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('System is not configured.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;

  console.log(`📞 Incoming call: ${from}`);

  // Store call
  db.run(
    'INSERT INTO calls (id, from_number, to_number, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [callSid, from, to, 'active', new Date().toISOString()]
  );

  // Notify dashboard
  broadcast({
    type: 'incoming_call',
    call_id: callSid,
    from,
    to,
    timestamp: new Date().toISOString(),
  });

  // Gather speech and send to AI
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say('Hi! Welcome to VTS Marine. How can I help you today?');
  const railwayUrl = process.env.RAILWAY_URL || 'https://vts-phone-agent-production.up.railway.app';
  twiml.gather({
    numDigits: 0,
    action: `${railwayUrl}/call/ai?CallSid=${callSid}&From=${from}`,
    method: 'POST',
    timeout: 10,
    speechTimeout: 'auto',
    language: 'en-US',
  }).say('Please tell me how I can assist you.');

  res.type('text/xml');
  res.send(twiml.toString());
});

// AI conversation
app.post('/call/ai', async (req, res) => {
  if (!isConfigured) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('System is not configured.');
    res.type('text/xml');
    res.send(twiml.toString());
    return;
  }

  const { CallSid, From } = req.query;
  const speechResult = req.body.SpeechResult || req.body.Digits || '';

  console.log(`🎤 Input (${CallSid}): "${speechResult}"`);

  try {
    if (!client) {
      throw new Error('Anthropic client not initialized');
    }

    // Get conversation history
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

    // System prompt
    const systemPrompt = `You are a helpful AI assistant for VTS Marine Yacht Service.

You help with:
- Service bookings (maintenance, repairs, detailing)
- Parts orders (marine equipment, supplies)
- Repair help & troubleshooting
- General customer support

Keep responses SHORT (1-2 sentences). Be conversational.
When booking: get their name, date/time preference.
When ordering parts: get part name and quantity.`;

    console.log(`🤖 Calling Claude...`);
    console.log(`   API Key present: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO'}`);
    console.log(`   API Key length: ${process.env.ANTHROPIC_API_KEY?.length || 0}`);

    // Call Claude
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: speechResult || 'Hello' },
      ],
    }).catch(err => {
      console.error(`   Full error:`, JSON.stringify(err, null, 2));
      throw err;
    });

    if (!response.content[0] || response.content[0].type !== 'text') {
      throw new Error('Invalid Claude response');
    }

    const aiResponse = response.content[0].text;
    console.log(`✅ Claude: "${aiResponse}"`);

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

    // Broadcast
    broadcast({
      type: 'ai_message',
      call_id: CallSid,
      from: 'ai',
      content: aiResponse,
      timestamp: now,
    });

    // Continue conversation or end
    const railwayUrl = process.env.RAILWAY_URL || 'https://vts-phone-agent-production.up.railway.app';
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(aiResponse);
    twiml.gather({
      numDigits: 0,
      action: `${railwayUrl}/call/ai?CallSid=${CallSid}&From=${From}`,
      method: 'POST',
      timeout: 5,
      speechTimeout: 'auto',
      language: 'en-US',
    }).say('You can continue, or say goodbye to end the call.');

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (err) {
    console.error(`❌ Error (${CallSid}):`, err.message);
    
    // Fallback - Fixed typo here!
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, there was an issue. Goodbye.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Call ended
app.post('/call/ended', (req, res) => {
  const callSid = req.body.CallSid;
  console.log(`📞 Call ended: ${callSid}`);

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

// API endpoints
app.get('/api/calls', (req, res) => {
  db.all('SELECT * FROM calls ORDER BY created_at DESC', (err, rows) => {
    res.json(rows || []);
  });
});

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
