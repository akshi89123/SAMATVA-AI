# 🪷 Samatva AI — Backend

Node.js/Express backend powering the **Antara AI Companion** feature with OpenAI GPT-4o-mini.

---

## Quick Start

### 1. Install dependencies
```bash
cd samatva-backend
npm install
```

### 2. Set up your API key
```bash
cp .env.example .env
```
Open `.env` and paste your OpenAI API key:
```
OPENAI_API_KEY=sk-your-real-key-here
```
Get a key at → https://platform.openai.com/api-keys

### 3. Start the server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

Server starts at **http://localhost:3001**

---

## API Endpoints

### `GET /api/health`
Health check — returns `{ status: "ok" }`.

### `POST /api/chat`
Send a message to Antara and get a reply.

**Request body:**
```json
{
  "message": "I feel anxious and overwhelmed",
  "sessionId": "user-abc-123",
  "userContext": {
    "mood": "Anxious",
    "guna": "Rajas dominant",
    "stress": "High"
  }
}
```

**Response:**
```json
{
  "reply": "I hear the restlessness in your words — this is Rajas at work...",
  "sessionId": "user-abc-123"
}
```

- `sessionId` — optional; used to maintain conversation history. Pass the same ID across messages for continuity.
- `userContext` — optional; passes mood/guna context to personalize Antara's response.

### `DELETE /api/chat/:sessionId`
Clears conversation history for a session (start fresh).

---

## Frontend Integration

The frontend (`SAMATVA AI.html`) is pre-configured to call `http://localhost:3001/api/chat`.

Make sure the backend is running before opening the HTML file. You can open it directly in your browser (no server needed for the frontend).

---

## Project Structure

```
samatva-backend/
├── server.js          # Main Express server + OpenAI integration
├── package.json
├── .env.example       # Copy to .env and add your API key
├── .env               # (gitignored) Your real secrets
└── README.md
```

---

## Notes

- Conversation history is stored **in-memory** (resets on server restart). For persistence, integrate MongoDB or a database.
- The AI model used is `gpt-4o-mini` — fast and cost-effective. Change to `gpt-4o` in `server.js` for higher quality.
- Rate limits apply based on your OpenAI plan.
