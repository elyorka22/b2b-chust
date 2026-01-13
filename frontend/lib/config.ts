// Конфигурация API
// В production используем переменную окружения NEXT_PUBLIC_BACKEND_URL
// Если не установлена, используем localhost для разработки
export const API_BASE_URL = 
  typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

// Логируем используемый API URL при инициализации
if (typeof window !== 'undefined') {
  console.log('[CONFIG] API_BASE_URL:', API_BASE_URL);
  console.log('[CONFIG] NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
  console.log('[CONFIG] User Agent:', navigator.userAgent);
  // Проверяем наличие Telegram Web App API
  const telegramWebApp = (window as any).Telegram?.WebApp;
  console.log('[CONFIG] Is Telegram Web App:', telegramWebApp ? 'Yes' : 'No');
}

