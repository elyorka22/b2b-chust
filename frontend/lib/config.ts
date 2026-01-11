// Конфигурация API
// В production используем переменную окружения NEXT_PUBLIC_BACKEND_URL
// Если не установлена, используем localhost для разработки
export const API_BASE_URL = 
  typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

