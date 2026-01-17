# B2B Chust - Multi-Service Architecture

## 🏗️ Структура проекта

Проект разделен на **3 отдельных сервиса** для деплоя на Railway:

```
b2b-chust/
├── frontend/          # Next.js Frontend (порт 3000)
│   ├── app/          # Страницы
│   ├── components/   # React компоненты
│   ├── lib/          # API клиент и утилиты
│   └── package.json
├── backend/          # Express API Server (порт 3001)
│   ├── server.js     # Главный файл сервера
│   ├── api/          # API модули (Telegram)
│   └── package.json
└── bot/              # Telegram Bot (порт 3002)
    ├── bot.js        # Главный файл бота
    └── package.json
```

## 🚀 Деплой на Railway

### Шаг 1: Создание проекта на Railway

1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий

### Шаг 2: Добавление трех сервисов

В Railway Dashboard добавьте **3 сервиса**:

#### 1. Frontend Service
- **Root Directory:** `frontend/`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** 3000 (автоматически)

**Environment Variables:**
```env
NEXT_PUBLIC_BACKEND_URL=https://backend-production-xxxx.up.railway.app
NODE_ENV=production
```

#### 2. Backend Service
- **Root Directory:** `backend/`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** 3001 (или автоматически)

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

#### 3. Bot Service
- **Root Directory:** `bot/`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** 3002 (или автоматически)

**Environment Variables:**
```env
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA
BACKEND_URL=https://backend-production-xxxx.up.railway.app
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
NODE_ENV=production
```

### Шаг 3: Обновление URL после деплоя

После деплоя Railway создаст три домена. Обновите переменные окружения:

1. **Frontend:** Обновите `NEXT_PUBLIC_BACKEND_URL` с URL Backend сервиса
2. **Bot:** Обновите `BACKEND_URL` и `FRONTEND_URL` с URL соответствующих сервисов

## 📋 Локальная разработка

### Запуск всех сервисов локально:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Bot
cd bot
npm install
npm run dev
```

## 🔗 Связь между сервисами

- **Frontend** → делает запросы к **Backend API**
- **Bot** → может делать запросы к **Backend API** для получения данных
- **Bot** → отправляет Web App ссылки на **Frontend**

## ✅ Преимущества разделения

1. **Независимое масштабирование** - можно увеличить ресурсы для каждого сервиса отдельно
2. **Независимые деплои** - изменения в одном сервисе не влияют на другие
3. **Разделение ответственности** - каждый сервис выполняет свою задачу
4. **Легче отладка** - логи разделены по сервисам

## 📝 Важные замечания

- Все три сервиса должны иметь доступ к одним и тем же переменным Supabase
- Backend URL должен быть доступен из Frontend и Bot
- Frontend URL нужен для Bot (Web App кнопки)
- CORS настроен в Backend для работы с Frontend





