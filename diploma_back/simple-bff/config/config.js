module.exports = { 
  AUTH_SERVICE_URL: 'http://localhost:8080/api/auth',
  AI_CHAT_SERVICE_URL: 'http://localhost:4000/api',
  NOTES_SERVICE_URL: 'http://localhost:8081/api/notes',
  ADMIN_SERVICE_URL: 'http://localhost:8090/api/admin',

  BFF_PORT: 3001,

  CORS_OPTIONS: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
};
