import axios from 'axios';
import { API_BASE_URL } from './config';
import { getAuthToken } from './auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Публичный API клиент без токена авторизации (для каталога товаров)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Добавляем токен авторизации в заголовки каждого запроса
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Логируем запросы для отладки
    console.log('[API] Запрос:', config.method?.toUpperCase(), (config.baseURL || '') + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем обработчик ответов для логирования ошибок
api.interceptors.response.use(
  (response) => {
    console.log('[API] Успешный ответ:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('[API] Ошибка запроса:', error.config?.url, error.response?.status, error.message);
    if (error.response) {
      console.error('[API] Данные ошибки:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  // Публичный метод без токена (для каталога)
  getAll: () => publicApi.get('/api/products').then(res => res.data),
  // Публичный метод без токена (для просмотра товара)
  getById: (id: string) => publicApi.get(`/api/products/${id}`).then(res => res.data),
  // Приватные методы с токеном (для админ-панели)
  create: (product: any) => api.post('/api/products', product).then(res => res.data),
  update: (id: string, updates: any) => api.put(`/api/products/${id}`, updates).then(res => res.data),
  delete: (id: string) => api.delete(`/api/products/${id}`).then(res => res.data),
};

// Orders API
export const ordersApi = {
  getAll: () => api.get('/api/orders').then(res => res.data),
  getById: (id: string) => api.get(`/api/orders/${id}`).then(res => res.data),
  create: (order: any) => api.post('/api/orders', order).then(res => res.data),
  update: (id: string, updates: any) => api.patch(`/api/orders/${id}`, updates).then(res => res.data),
};

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/api/auth/login', { username, password }).then(res => res.data),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/api/users').then(res => res.data),
  getById: (id: string) => api.get(`/api/users/${id}`).then(res => res.data),
  create: (user: any) => api.post('/api/users', user).then(res => res.data),
};

// Stats API
export const statsApi: {
  get: () => Promise<any>;
  getSales: () => Promise<any>;
} = {
  get: () => api.get('/api/stats').then(res => res.data),
  getSales: () => api.get('/api/stats/sales').then(res => res.data),
};

// Telegram API
export const telegramApi = {
  send: (chatId: number, message: string, webAppUrl?: string) =>
    api.post('/api/telegram/send', { chatId, message, webAppUrl }).then(res => res.data),
  sendMass: (message: string, webAppUrl?: string) =>
    api.post('/api/telegram/send-mass', { message, webAppUrl }).then(res => res.data),
  getStats: () => api.get('/api/telegram/stats').then(res => res.data),
};

// Bot Settings API
export const botSettingsApi = {
  getAll: () => api.get('/api/bot/settings').then(res => res.data),
  get: (key: string) => api.get(`/api/bot/settings/${key}`).then(res => res.data),
  update: (key: string, value: string) => api.put(`/api/bot/settings/${key}`, { value }).then(res => res.data),
};

// User Telegram Chat ID API
export const userApi = {
  updateTelegramChatId: (userId: string, telegramChatId: number | null) =>
    api.put(`/api/users/${userId}/telegram-chat-id`, { telegramChatId }).then(res => res.data),
  updatePassword: (userId: string, currentPassword: string | null, newPassword: string) =>
    api.put(`/api/users/${userId}/password`, { currentPassword, newPassword }).then(res => res.data),
};

// Contact Page API
export const contactPageApi = {
  get: () => api.get('/api/contact-page').then(res => res.data),
  update: (data: any) => api.put('/api/contact-page', data).then(res => res.data),
};

