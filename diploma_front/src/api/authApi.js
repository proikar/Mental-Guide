import axios from 'axios';

const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:8080/api/auth';
const CHAT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const ADMIN_API_URL = process.env.REACT_APP_ADMIN_URL || 'http://localhost:8090/admin';

// Create axios instance
const createApiInstance = (baseURL, isAdmin = false) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: !isAdmin
  });

  instance.interceptors.request.use(config => {
    const token = isAdmin 
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('token');
      
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') 
        ? token 
        : `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        if (isAdmin) {
          localStorage.removeItem('adminToken');
        } else {
          localStorage.removeItem('token');
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const authApi = createApiInstance(AUTH_API_URL);
const chatApi = createApiInstance(CHAT_API_URL);
const adminApi = createApiInstance(ADMIN_API_URL, true);

export const authUtils = {
  setToken: (token, isAdmin = false) => {
    const cleanToken = token.replace(/^"|"$/g, '');
    localStorage.setItem(isAdmin ? 'adminToken' : 'token', cleanToken);
  },
  removeToken: (isAdmin = false) => {
    localStorage.removeItem(isAdmin ? 'adminToken' : 'token');
  },
  getToken: (isAdmin = false) => {
    return localStorage.getItem(isAdmin ? 'adminToken' : 'token');
  },
  clearAllTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
  }
};

const handleApiError = (error) => {
  const errorMessages = {
    400: 'Некорректный запрос',
    401: 'Требуется авторизация',
    403: 'Доступ запрещен',
    404: 'Ресурс не найден',
    500: 'Ошибка сервера',
    503: 'Сервис недоступен'
  };

  if (error.response) {
    const { status, data } = error.response;
    return {
      message: data?.message || data?.error || errorMessages[status] || 'Ошибка запроса',
      status,
      data
    };
  } else if (error.request) {
    return { message: 'Сервер не отвечает', status: 503 };
  }
  return { message: error.message || 'Неизвестная ошибка', status: 0 };
};

export const authService = {
  register: async (userData) => {
    try {
      const response = await authApi.post('/register', userData);
      if (response.data.token) authUtils.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  login: async (credentials) => {
    try {
      const response = await authApi.post('/login', credentials);
      if (response.data.token) authUtils.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  googleAuth: () => {
    window.location.href = `${AUTH_API_URL}/oauth2/authorization/google`;
  },

  getProfile: async () => {
    try {
      const response = await authApi.get('/profile');
      return {
        id: response.data.id,
        username: response.data.username || response.data.email.split('@')[0],
        email: response.data.email,
        createdAt: response.data.createdAt
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await authApi.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async () => {
    try {
      await authApi.post('/logout');
    } finally {
      authUtils.removeToken();
    }
  },

  validateToken: async () => {
    try {
      const token = authUtils.getToken();
      if (!token) return false;
      await authApi.get('/validate-token');
      return true;
    } catch {
      return false;
    }
  }
};

export const adminService = {
  login: async (credentials) => {
    try {
      const response = await adminApi.post('/auth/login', credentials);
      if (response.data.isAdmin) {
        authUtils.setToken('admin-dummy-token', true);
        return response.data;
      }
      throw new Error('Доступ запрещен');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: () => {
    authUtils.removeToken(true);
  },

  getUsers: async () => {
    try {
      const response = await adminApi.get('/users');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserChats: async (userId) => {
    try {
      const response = await adminApi.get(`/chats/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserNotes: async (userId) => {
    try {
      const response = await adminApi.get(`/notes/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStats: async () => {
    try {
      const response = await adminApi.get('/stats/summary');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getRegistrationStats: async () => {
    try {
      const response = await adminApi.get('/stats/registrations');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getMessageStats: async () => {
    try {
      const response = await adminApi.get('/stats/messages');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  validateAdmin: async () => {
    try {
      const token = authUtils.getToken(true);
      if (!token) return false;
      return token === 'admin-dummy-token';
    } catch {
      return false;
    }
  }
};

export const chatService = {
  sendMessage: async (message) => {
    try {
      const response = await chatApi.post('/chat', {
        user_input: message,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getHistory: async () => {
    try {
      const response = await chatApi.get('/history');
      return response.data.map(item => ({
        ...item,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  },

  clearHistory: async () => {
    try {
      const response = await chatApi.delete('/history');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export const initializeAuth = async () => {
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');

  if (adminToken && adminToken === 'admin-dummy-token') {
    return { isAdmin: true, isUser: false };
  }

  if (token) {
    try {
      await authApi.get('/validate-token');
      return { isAdmin: false, isUser: true };
    } catch {
      localStorage.removeItem('token');
    }
  }

  return { isAdmin: false, isUser: false };
};