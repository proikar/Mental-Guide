const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { 
  AUTH_SERVICE_URL, 
  AI_CHAT_SERVICE_URL, 
  NOTES_SERVICE_URL,
  ADMIN_SERVICE_URL,
  BFF_PORT,
  CORS_OPTIONS
} = require('./config/config');

const app = express();

app.use(cors(CORS_OPTIONS));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.use('/api/auth', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AUTH_SERVICE_URL}${req.path}`,
      data: req.body,
      headers: {
        'Authorization': req.headers['authorization'],
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Auth service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Auth service error'
    });
  }
});

app.use('/api/chat', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AI_CHAT_SERVICE_URL}${req.path}`,
      data: req.body,
      headers: {
        'Authorization': req.headers['authorization'],
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('AI Chat service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'AI Chat service error'
    });
  }
});

app.use('/api/notes', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${NOTES_SERVICE_URL}${req.path}`,
      data: req.body,
      headers: {
        'Authorization': req.headers['authorization'],
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Notes service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Notes service error'
    });
  }
});

app.use('/api/admin', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ADMIN_SERVICE_URL}${req.path}`,
      data: req.body,
      headers: {
        'Authorization': req.headers['authorization'],
        'Content-Type': 'application/json'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Admin service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Admin service error'
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use((err, req, res, next) => {
  console.error('BFF error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(BFF_PORT, () => {
  console.log(`
  BFF Server is running!
  Port: ${BFF_PORT}
  
  Auth Service: ${AUTH_SERVICE_URL}
  AI Chat Service: ${AI_CHAT_SERVICE_URL}
  Notes Service: ${NOTES_SERVICE_URL}
  Admin Service: ${ADMIN_SERVICE_URL}
  `);
});
