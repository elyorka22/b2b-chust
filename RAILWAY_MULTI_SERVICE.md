# Railway Multi-Service Setup

## 🏗️ Архитектура: 3 отдельных сервиса

```
Railway Project
├── Frontend Service (Next.js) - порт 3000
├── Backend Service (Express API) - порт 3001  
└── Bot Service (Telegram Bot) - порт 3002
```

## 📁 Структура проекта

```
b2b-chust/
├── frontend/          # Next.js приложение (только UI)
│   ├── app/          # Страницы
│   ├── components/   # React компоненты
│   ├── lib/          # API клиент
│   └── package.json
├── backend/          # Express API сервер
│   ├── server.js     # Главный файл сервера
│   ├── api/          # API модули
│   └── package.json
├── bot/              # Telegram Bot
│   ├── bot.js        # Главный файл бота
│   └── package.json
└── railway.json      # Конфигурация Railway
```

## 🚂 Настройка Railway

### Вариант 1: Три отдельных сервиса в одном проекте

1. **Создайте проект на Railway**
2. **Добавьте три сервиса:**
   - Frontend (из папки `frontend/`)
   - Backend (из папки `backend/`)
   - Bot (из папки `bot/`)

### Вариант 2: Использование Railway.toml

Создайте `railway.toml` в корне проекта:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
```

Но для трех сервисов лучше использовать Railway Dashboard.

## 📋 Настройка каждого сервиса

### 1. Frontend Service

**Root Directory:** `frontend/`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** 3000 (автоматически)

**Environment Variables:**
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NODE_ENV=production
```

### 2. Backend Service

**Root Directory:** `backend/`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Port:** 3001 (или Railway назначит автоматически)

**Environment Variables:**
```env
PORT=3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA
NODE_ENV=production
```

### 3. Bot Service

**Root Directory:** `bot/`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Port:** 3002 (или Railway назначит автоматически)

**Environment Variables:**
```env
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA
BACKEND_URL=https://your-backend.railway.app
FRONTEND_URL=https://your-frontend.railway.app
NODE_ENV=production
```

## 🔗 Связь между сервисами

### Frontend → Backend
- Frontend делает запросы к `NEXT_PUBLIC_BACKEND_URL`
- Все API запросы идут на Backend сервис

### Bot → Backend
- Bot может делать запросы к Backend API для получения данных
- Использует `BACKEND_URL` для связи

### Bot → Frontend
- Bot отправляет Web App ссылки на Frontend
- Использует `FRONTEND_URL` в кнопках

## 📝 Railway Service URLs

После деплоя Railway создаст три домена:
- Frontend: `https://frontend-production-xxxx.up.railway.app`
- Backend: `https://backend-production-xxxx.up.railway.app`
- Bot: `https://bot-production-xxxx.up.railway.app`

Или можно использовать кастомные домены.

## 🔧 Обновление переменных окружения

После получения URL сервисов, обновите:

**Frontend:**
```env
NEXT_PUBLIC_BACKEND_URL=https://backend-production-xxxx.up.railway.app
```

**Bot:**
```env
BACKEND_URL=https://backend-production-xxxx.up.railway.app
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
```

## ✅ Чеклист деплоя

- [ ] Создать проект на Railway
- [ ] Добавить Frontend сервис (root: `frontend/`)
- [ ] Добавить Backend сервис (root: `backend/`)
- [ ] Добавить Bot сервис (root: `bot/`)
- [ ] Настроить переменные окружения для каждого сервиса
- [ ] Получить URL каждого сервиса
- [ ] Обновить переменные окружения с правильными URL
- [ ] Протестировать работу всех сервисов

## 🎯 Преимущества разделения

1. **Независимое масштабирование** - можно увеличить ресурсы для каждого сервиса отдельно
2. **Независимые деплои** - изменения в одном сервисе не влияют на другие
3. **Разделение ответственности** - каждый сервис выполняет свою задачу
4. **Легче отладка** - логи разделены по сервисам

## ⚠️ Важно

- Все три сервиса должны иметь доступ к одним и тем же переменным Supabase
- Backend URL должен быть доступен из Frontend и Bot
- Frontend URL нужен для Bot (Web App кнопки)


