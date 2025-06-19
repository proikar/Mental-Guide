import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { chat, history, mood, moodHistory, currentMood } from './chatController.js';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authenticateToken } from './middlewares/authMiddleware.js';

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use('/api', authenticateToken);

app.post('/api/chat', chat);
app.get('/api/history', history);
app.post('/api/mood', mood);
app.get('/api/mood/history', moodHistory);
app.get('/api/mood/current', currentMood);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Произошла непредвиденная ошибка',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI Chat Service running on http://localhost:${PORT}`);
});