# 🔧 Исправление проблемы с подключением к Backend

## Проблема
Frontend не может подключиться к Backend, ошибка: `ERR_CONNECTION_REFUSED` на `localhost:3001`

## Причина
Переменная окружения `NEXT_PUBLIC_BACKEND_URL` не установлена в Railway для Frontend сервиса.

## Решение

### Шаг 1: Получите URL Backend сервиса
1. Откройте Railway Dashboard
2. Перейдите в ваш Backend сервис
3. Скопируйте URL сервиса (например: `https://backend-production-xxxx.up.railway.app`)

### Шаг 2: Установите переменную окружения для Frontend
1. В Railway Dashboard перейдите в **Frontend сервис**
2. Откройте вкладку **Variables**
3. Добавьте новую переменную:
   - **Key:** `NEXT_PUBLIC_BACKEND_URL`
   - **Value:** URL вашего Backend сервиса (из Шага 1)
4. Нажмите **Add**

### Шаг 3: Перезапустите Frontend сервис
1. После добавления переменной Railway автоматически перезапустит сервис
2. Или вручную: Settings → Restart

### Шаг 4: Проверьте
1. Откройте ваш Frontend сайт
2. Откройте консоль браузера (F12)
3. Проверьте, что запросы идут на правильный URL (не localhost:3001)

## Пример правильной конфигурации

**Frontend Service Variables:**
```env
NEXT_PUBLIC_BACKEND_URL=https://backend-production-xxxx.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

**Backend Service Variables:**
```env
FRONTEND_URL=https://frontend-production-39e9.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
TELEGRAM_BOT_TOKEN=your-bot-token
NODE_ENV=production
```

## ⚠️ Исправление CORS ошибки

Если вы видите ошибку:
```
The 'Access-Control-Allow-Origin' header contains the invalid value 'frontend-production-39e9.up.railway.app'
```

**Проблема:** В переменной `FRONTEND_URL` указан URL без протокола `https://`

**Решение:**
1. Откройте Backend сервис в Railway
2. Перейдите в Variables
3. Найдите переменную `FRONTEND_URL`
4. Убедитесь, что значение начинается с `https://`:
   - ✅ Правильно: `https://frontend-production-39e9.up.railway.app`
   - ❌ Неправильно: `frontend-production-39e9.up.railway.app`
5. Если неправильно, обновите значение и добавьте `https://` в начало
6. Перезапустите Backend сервис

## Важно
- `NEXT_PUBLIC_BACKEND_URL` должен быть **полным URL** с `https://`
- `FRONTEND_URL` должен быть **полным URL** с `https://`
- Не используйте `localhost` в production
- После изменения переменных окружения Railway автоматически пересоберет и перезапустит сервис

