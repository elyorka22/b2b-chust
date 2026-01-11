// Клиентская версия auth - только для проверки токенов в браузере
// Вся аутентификация происходит через Backend API

export interface AuthUser {
  id: string;
  username: string;
  role: 'super-admin' | 'magazin';
  storeName?: string;
}

export interface CustomerAuth {
  id: string;
  phone: string;
  name?: string;
}

// Получить токен из cookies (только на клиенте)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('auth-token='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

// Получить токен покупателя из cookies (только на клиенте)
export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('customer-token='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

// Проверить, авторизован ли пользователь (только проверка наличия токена)
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Проверить, авторизован ли покупатель
export function isCustomerAuthenticated(): boolean {
  return getCustomerToken() !== null;
}

// Получить данные пользователя из токена (безопасная проверка только на клиенте)
// В реальном приложении лучше получать через API
export function getCurrentUserFromToken(): AuthUser | null {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    // Простая проверка структуры токена (без верификации подписи)
    // В production лучше получать через API endpoint
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      storeName: payload.storeName,
    };
  } catch {
    return null;
  }
}

// Получить данные покупателя из токена
export function getCurrentCustomerFromToken(): CustomerAuth | null {
  const token = getCustomerToken();
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.id,
      phone: payload.phone,
      name: payload.name,
    };
  } catch {
    return null;
  }
}
