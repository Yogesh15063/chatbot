import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'chat.db'));

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://678d1b94f0cfce3b7c21cdc0--boisterous-moxie-1d757c.netlify.app/' // e.g. https://your-app.netlify.app
    : 'http://localhost:5173'
}));
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    sender TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get chat history
app.get('/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY timestamp ASC').all();
  res.json(messages);
});

// Send message
app.post('/messages', async (req, res) => {
  const { content } = req.body;
  
  try {
    // Store user message
    const insertMsg = db.prepare('INSERT INTO messages (content, sender) VALUES (?, ?)');
    insertMsg.run(content, 'user');

    // Get AI response
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(content);
    const response = result.response.text();

    // Store AI response
    insertMsg.run(response, 'ai');

    res.json({ success: true, response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});