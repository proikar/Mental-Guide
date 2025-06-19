import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    const cleanToken = token.replace(/^"|"$/g, '');
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const chatApi = {
  sendMessage: async (message) => {
    const response = await api.post('/api/chat', { user_input: message });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/api/history');
    return response.data.history || [];
  }
};

export const moodApi = {
  getCurrentMood: async () => {
    try {
      const response = await api.get('/api/mood/current');
      if (response.data.keywords && typeof response.data.keywords === 'string') {
        try {
          response.data.keywords = JSON.parse(response.data.keywords);
        } catch (e) {
          console.warn("Ошибка парсинга ключевых слов:", e);
          response.data.keywords = [];
        }
      }
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении текущего настроения:', error);
      throw error;
    }
  },
  getMoodHistory: async (limit = 10) => {
    try {
      const response = await api.get('/api/mood/history', { params: { limit } });
      return response.data.map(item => {
        if (item.keywords && typeof item.keywords === 'string') {
          try {
            item.keywords = JSON.parse(item.keywords);
          } catch (e) {
            console.warn("Ошибка парсинга ключевых слов:", e);
            item.keywords = [];
          }
        }
        return item;
      });
    } catch (error) {
      console.error('Ошибка при получении истории настроения:', error);
      throw error;
    }
  }
};