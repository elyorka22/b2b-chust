import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Products API
export const productsApi = {
  getAll: () => api.get('/api/products').then(res => res.data),
  getById: (id: string) => api.get(`/api/products/${id}`).then(res => res.data),
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
  create: (user: any) => api.post('/api/users', user).then(res => res.data),
};

// Stats API
export const statsApi = {
  get: () => api.get('/api/stats').then(res => res.data),
};

// Telegram API
export const telegramApi = {
  send: (chatId: number, message: string, webAppUrl?: string) =>
    api.post('/api/telegram/send', { chatId, message, webAppUrl }).then(res => res.data),
  getStats: () => api.get('/api/telegram/stats').then(res => res.data),
};

