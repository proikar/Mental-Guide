import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_NOTES_URL || 'http://localhost:8081';
const NOTES_API_URL = `${API_BASE_URL}/notes`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Интерцептор для JWT токена
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Методы API для работы с заметками
export const notesService = {
  getNotes: async () => {
    try {
      const response = await api.get('/notes');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  addNote: async (content) => {
    try {
      // Получаем userId из токена
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      
      const response = await api.post('/notes', { 
        content,
        userId 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  editNote: async (id, content) => {
    try {
      const response = await api.put(`/notes/${id}`, { content });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteNote: async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Обработчик ошибок API
function handleApiError(error) {
  const errorMessages = {
    400: 'Некорректный запрос',
    401: 'Требуется авторизация',
    403: 'Доступ запрещен',
    404: 'Заметка не найдена',
    500: 'Ошибка сервера'
  };

  if (error.response) {
    const { status, data } = error.response;
    error.message = data?.message || errorMessages[status] || 'Ошибка запроса';
    error.status = status;
  } else {
    error.message = error.message || 'Неизвестная ошибка';
    error.status = 0;
  }
  
  return error;
}

export default api;