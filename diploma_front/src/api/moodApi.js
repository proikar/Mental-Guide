import axios from 'axios';

const moodApi = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true
});

const handleApiError = (error) => {
  if (error.response) {
    const message = error.response.data?.message ||
      error.response.data?.error ||
      `Ошибка сервера: ${error.response.status}`;
    throw new Error(message);
  } else if (error.request) {
    throw new Error('Сервер не отвечает. Проверьте подключение к интернету.');
  } else {
    throw new Error('Ошибка при отправке запроса: ' + error.message);
  }
};

export const getCurrentMood = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Токен авторизации не найден');

    const response = await moodApi.get('/mood/current', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('API response (current mood):', response.data);

    const data = response.data;
    if (typeof data.keywords === 'string') {
      try {
        data.keywords = JSON.parse(data.keywords);
      } catch (e) {
        console.warn("Ошибка парсинга ключевых слов:", e);
        data.keywords = [];
      }
    } else if (!Array.isArray(data.keywords)) {
      data.keywords = [];
    }

    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getMoodHistory = async (limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Токен авторизации не найден');

    const response = await moodApi.get(`/mood/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('API response (mood history):', response.data);

    return response.data.map(item => {
      if (typeof item.keywords === 'string') {
        try {
          item.keywords = JSON.parse(item.keywords);
        } catch (e) {
          console.warn("Ошибка парсинга ключевых слов:", e);
          item.keywords = [];
        }
      } else if (!Array.isArray(item.keywords)) {
        item.keywords = [];
      }
      return item;
    });
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  getCurrentMood,
  getMoodHistory
};
