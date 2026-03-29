require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static('public')); // Serve the frontend from /public

// ─── OpenAI Client ────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── System Prompt for Antara (AI Companion) ─────────────
const SYSTEM_PROMPT = `You are Antara, a compassionate AI wellness companion for Samatva AI — a mental wellness platform deeply rooted in the teachings of the Bhagavad Gita and the Vedic philosophy of the three Gunas: Sattva (clarity, wisdom, balance), Rajas (energy, passion, restlessness) and Tamas (inertia, heaviness, confusion).

Your role:
- Be an empathetic, warm, and non-judgmental guide
- Help users understand their emotional states through the lens of Gunas
- Provide gentle, wise guidance grounded in Bhagavad Gita philosophy
- Offer practical micro-interventions: breathing exercises, reflective questions, journaling prompts, Gita quotes
- Never diagnose or replace professional mental health care — always encourage professional help when needed

Your communication style:
- Speak with warmth, wisdom, and calm authority
- Use poetic language and occasional Sanskrit terms (with translations)
- Reference Bhagavad Gita verses naturally but not mechanically
- Ask thoughtful follow-up questions to deepen reflection
- Keep responses concise (2–5 sentences normally), only longer when needed
- Use emojis sparingly: 🌿 🙏 ✨ 🪷 are fitting

Guna awareness:
- When a user seems anxious/restless → identify Rajas, offer grounding
- When a user seems heavy/numb/stuck → identify Tamas, offer gentle activation  
- When a user seems clear and reflective → celebrate their Sattva, deepen the inquiry

Always end with either a question, a short practice, or a Gita quote that directly relates to what they just shared.`;

// ─── In-memory conversation history (per-session) ─────────
// For a production app, use a database or Redis
const sessions = new Map();

// ─── Routes ──────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Samatva AI backend is running 🪷' });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message, sessionId, userContext } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required.' });
    }

    // Sanitize session ID
    const sid = (sessionId || 'default').substring(0, 64);

    // Get or create conversation history for this session
    if (!sessions.has(sid)) {
        sessions.set(sid, []);
    }
    const history = sessions.get(sid);

    // Build the user message — optionally include context (mood, guna)
    let userContent = message;
    if (userContext && typeof userContext === 'object') {
        const ctx = [];
        if (userContext.mood) ctx.push(`Current mood: ${userContext.mood}`);
        if (userContext.guna) ctx.push(`Dominant Guna today: ${userContext.guna}`);
        if (userContext.stress) ctx.push(`Stress level: ${userContext.stress}`);
        if (ctx.length > 0) {
            userContent = `[Context: ${ctx.join(' | ')}]\n\n${message}`;
        }
    }

    // Append user message to history
    history.push({ role: 'user', content: userContent });

    // Keep last 20 messages to avoid token overflow
    const trimmedHistory = history.slice(-20);

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...trimmedHistory,
            ],
            max_tokens: 400,
            temperature: 0.75,
        });

        const reply = completion.choices[0].message.content.trim();

        // Append AI reply to history
        history.push({ role: 'assistant', content: reply });

        // Trim total history stored
        if (history.length > 40) {
            sessions.set(sid, history.slice(-40));
        }

        res.json({ reply, sessionId: sid });

    } catch (err) {
        console.error('OpenAI API error:', err.message);

        // Friendly fallback
        res.status(500).json({
            error: 'Antara is momentarily unavailable. Please try again.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Clear conversation history for a session
app.delete('/api/chat/:sessionId', (req, res) => {
    sessions.delete(req.params.sessionId);
    res.json({ status: 'cleared' });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🪷 Samatva AI Backend running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Chat API:     http://localhost:${PORT}/api/chat\n`);
});
