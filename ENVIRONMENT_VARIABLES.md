# 🔐 Переменные окружения для Railway

## 📋 Полный список переменных по сервисам

### 🎨 Frontend Service

**Root Directory:** `frontend/`

```env
# Supabase (только для публичного доступа)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://backend-production-xxxx.up.railway.app

# Environment
NODE_ENV=production
PORT=3000
```

**Описание:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Публичный ключ для клиентских запросов (безопасно публиковать)
- `NEXT_PUBLIC_BACKEND_URL` - URL Backend сервиса (получите после деплоя Backend)
- `NODE_ENV` - Режим работы (production)
- `PORT` - Порт для Next.js (Railway назначит автоматически, но можно указать)

---

### ⚙️ Backend Service

**Root Directory:** `backend/`

```env
# Supabase (полный доступ)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT для аутентификации
JWT_SECRET=your-very-secret-jwt-key-change-this-in-production

# Telegram Bot
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA

# Frontend URL (для CORS)
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app

# Environment
NODE_ENV=production
PORT=3001
```

**Описание:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Публичный ключ (для совместимости)
- `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ **СЕКРЕТНЫЙ КЛЮЧ** - полный доступ к БД (НЕ ПУБЛИКУЙТЕ!)
- `JWT_SECRET` - Секретный ключ для подписи JWT токенов (используйте случайную строку)
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
- `FRONTEND_URL` - URL Frontend сервиса (для CORS, получите после деплоя Frontend)
- `NODE_ENV` - Режим работы (production)
- `PORT` - Порт для Express сервера (Railway назначит автоматически)

---

### 🤖 Bot Service

**Root Directory:** `bot/`

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA

# Backend API URL
BACKEND_URL=https://backend-production-xxxx.up.railway.app

# Frontend URL (для Web App кнопок)
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app

# Environment
NODE_ENV=production
PORT=3002
```

**Описание:**
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота (тот же, что в Backend)
- `BACKEND_URL` - URL Backend сервиса (для API запросов)
- `FRONTEND_URL` - URL Frontend сервиса (для Web App кнопок в боте)
- `NODE_ENV` - Режим работы (production)
- `PORT` - Порт для бота (Railway назначит автоматически)

---

## 🔑 Как получить Supabase ключи

### 1. Откройте Supabase Dashboard
- Зайдите на [supabase.com](https://supabase.com)
- Откройте ваш проект

### 2. Перейдите в Settings > API
- В левом меню выберите **Settings**
- Выберите **API**

### 3. Скопируйте ключи

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
→ Используйте как `NEXT_PUBLIC_SUPABASE_URL`

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
→ Используйте как `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
→ Используйте как `SUPABASE_SERVICE_ROLE_KEY` (⚠️ ТОЛЬКО В BACKEND!)

---

## 🔐 Как сгенерировать JWT_SECRET

### Вариант 1: Онлайн генератор
- Используйте [randomkeygen.com](https://randomkeygen.com/)
- Выберите "CodeIgniter Encryption Keys"
- Скопируйте любой ключ (минимум 32 символа)

### Вариант 2: Через Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Вариант 3: Через OpenSSL
```bash
openssl rand -hex 32
```

**Пример:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 📝 Порядок настройки на Railway

### Шаг 1: Деплой Backend
1. Добавьте Backend сервис
2. Добавьте переменные окружения (кроме `FRONTEND_URL`)
3. Дождитесь деплоя
4. Скопируйте URL Backend сервиса

### Шаг 2: Деплой Frontend
1. Добавьте Frontend сервис
2. Добавьте переменные окружения
3. В `NEXT_PUBLIC_BACKEND_URL` укажите URL из Шага 1
4. Дождитесь деплоя
5. Скопируйте URL Frontend сервиса

### Шаг 3: Обновите Backend
1. В Backend сервисе обновите `FRONTEND_URL` на URL из Шага 2
2. Railway автоматически перезапустит сервис

### Шаг 4: Деплой Bot
1. Добавьте Bot сервис
2. Добавьте переменные окружения
3. В `BACKEND_URL` укажите URL из Шага 1
4. В `FRONTEND_URL` укажите URL из Шага 2
5. Дождитесь деплоя

---

## ⚠️ Важные замечания

### Безопасность

1. **SUPABASE_SERVICE_ROLE_KEY**:
   - ⚠️ **НИКОГДА** не добавляйте в Frontend или Bot
   - ⚠️ Только в Backend сервисе
   - ⚠️ Имеет полный доступ к БД, обходит все RLS политики

2. **JWT_SECRET**:
   - Используйте длинную случайную строку (минимум 32 символа)
   - Не используйте простые пароли
   - Храните только в переменных окружения

3. **TELEGRAM_BOT_TOKEN**:
   - Можно использовать в Backend и Bot
   - Не публикуйте в открытом доступе

### Префикс NEXT_PUBLIC_

Переменные с префиксом `NEXT_PUBLIC_` в Next.js:
- Доступны в браузере (клиентском коде)
- Безопасно публиковать только `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **НЕ** используйте `NEXT_PUBLIC_` для секретных ключей!

---

## ✅ Чеклист перед деплоем

- [ ] Создан проект в Supabase
- [ ] Применена миграция `001_initial_schema.sql`
- [ ] Получены все ключи из Supabase (URL, anon key, service_role key)
- [ ] Сгенерирован `JWT_SECRET`
- [ ] Получен `TELEGRAM_BOT_TOKEN`
- [ ] Все переменные добавлены в соответствующие сервисы на Railway
- [ ] URL сервисов обновлены после деплоя

---

## 🔄 Обновление переменных

Если нужно обновить переменные после деплоя:

1. Откройте сервис в Railway Dashboard
2. Перейдите в **Variables**
3. Нажмите на переменную для редактирования
4. Введите новое значение
5. Railway автоматически перезапустит сервис

---

## 📚 Дополнительная информация

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)


